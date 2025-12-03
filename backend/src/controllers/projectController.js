const Project = require("../models/Project");
const User = require("../models/User");
const AuditLog = require("../models/AuditLog");

/* ================================
   GET ALL PROJECTS
================================ */
exports.getAllProjects = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, priority, search, department } =
      req.query;

    const filter = { isActive: true };

    // USER → faqat o‘zi a’zo/manager bo‘lganlari
    if (req.user.role.name === "USER") {
      filter.$or = [
        { manager: req.user._id },
        { "members.user": req.user._id },
      ];
    }

    // MANAGER → faqat o‘z bo‘limidagi projectlar
    if (req.user.role.name === "MANAGER") {
      filter.department = req.user.department;
    }

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (department) filter.department = department;

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { code: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;

    const projects = await Project.find(filter)
      .populate("manager", "fullName email avatar")
      .populate("department", "name code")
      .populate("members.user", "fullName email avatar")
      .limit(parseInt(limit))
      .skip(skip)
      .sort({ createdAt: -1 });

    const total = await Project.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        projects,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: parseInt(limit),
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Loyihalarni olishda xatolik",
      error: error.message,
    });
  }
};

/* ================================
   GET PROJECT BY ID
================================ */
exports.getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate("manager", "fullName email avatar position")
      .populate("department", "name code description")
      .populate("members.user", "fullName email avatar position");

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Loyiha topilmadi",
      });
    }

    const isAdmin = req.user.role.name === "ADMIN";
    const isManager = project.manager._id.toString() === req.user._id.toString();
    const isMember = project.members.some(
      (m) => m.user._id.toString() === req.user._id.toString()
    );
    const isManagerDepartment =
      req.user.role.name === "MANAGER" &&
      project.department.toString() === req.user.department.toString();

    if (!isAdmin && !isManager && !isMember && !isManagerDepartment) {
      return res.status(403).json({
        success: false,
        message: "Bu loyihaga kirishga ruxsatingiz yo'q",
      });
    }

    res.status(200).json({ success: true, data: project });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Loyihaning maʼlumotlarini olishda xatolik",
      error: error.message,
    });
  }
};

/* ================================
   CREATE PROJECT
================================ */
exports.createProject = async (req, res) => {
  try {
    const projectData = {
      ...req.body,
      manager: req.body.manager || req.user._id,
    };

    // MANAGER → faqat o‘z bo‘limiga yaratadi
    if (req.user.role.name === "MANAGER") {
      if (req.body.department !== String(req.user.department)) {
        return res.status(403).json({
          success: false,
          message: "Faqat o‘z bo‘limingiz uchun loyiha yaratishingiz mumkin",
        });
      }
    }

    if (!projectData.code) {
      const count = await Project.countDocuments();
      projectData.code = `PROJ-${String(count + 1).padStart(4, "0")}`;
    }

    const project = await Project.create(projectData);

    // Manager ni avtomatik member qilish
    project.members.push({ user: project.manager, role: "LEAD" });
    await project.save();

    await project.populate("manager", "fullName email");

    await AuditLog.create({
      user: req.user._id,
      action: "CREATE_PROJECT",
      entity: "Project",
      entityId: project._id,
      changes: { created: project.toJSON() },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.status(201).json({
      success: true,
      message: "Loyiha yaratildi",
      data: project,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Loyiha yaratishda xatolik",
      error: error.message,
    });
  }
};

/* ================================
   UPDATE PROJECT
================================ */
exports.updateProject = async (req, res) => {
  try {
    const oldProject = await Project.findById(req.params.id);
    if (!oldProject) {
      return res.status(404).json({
        success: false,
        message: "Loyiha topilmadi",
      });
    }

    const isAdmin = req.user.role.name === "ADMIN";
    const isManager =
      oldProject.manager.toString() === req.user._id.toString();
    const isManagerDepartment =
      req.user.role.name === "MANAGER" &&
      oldProject.department.toString() === req.user.department.toString();

    if (!isAdmin && !isManager && !isManagerDepartment) {
      return res.status(403).json({
        success: false,
        message: "Bu loyihani yangilashga ruxsatingiz yo'q",
      });
    }

    const updated = await Project.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    ).populate("manager", "fullName email");

    await AuditLog.create({
      user: req.user._id,
      action: "UPDATE_PROJECT",
      entity: "Project",
      entityId: updated._id,
      changes: { old: oldProject.toJSON(), new: updated.toJSON() },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.status(200).json({
      success: true,
      message: "Loyiha yangilandi",
      data: updated,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Loyihani yangilashda xatolik",
      error: error.message,
    });
  }
};

/* ================================
   ADD MEMBER
================================ */
exports.addMember = async (req, res) => {
  try {
    const { userId, role = "MEMBER" } = req.body;

    const project = await Project.findById(req.params.id);
    if (!project)
      return res
        .status(404)
        .json({ success: false, message: "Loyiha topilmadi" });

    const user = await User.findById(userId);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "Foydalanuvchi topilmadi" });

    // MANAGER → bo‘limdan tashqari user qo‘sha olmaydi
    if (req.user.role.name === "MANAGER") {
      if (project.department.toString() !== req.user.department.toString()) {
        return res.status(403).json({
          success: false,
          message: "Boshqa bo‘lim loyihasiga foydalanuvchi qo‘sha olmaysiz",
        });
      }

      if (user.department.toString() !== req.user.department.toString()) {
        return res.status(403).json({
          success: false,
          message: "Boshqa bo‘lim xodimini loyihaga qo‘sha olmaysiz",
        });
      }
    }

    const exists = project.members.some((m) => m.user.toString() === userId);
    if (exists)
      return res.status(400).json({
        success: false,
        message: "Bu foydalanuvchi allaqachon loyiha a'zosi",
      });

    project.members.push({ user: userId, role });
    await project.save();

    await project.populate("members.user", "fullName email avatar");

    await AuditLog.create({
      user: req.user._id,
      action: "ADD_PROJECT_MEMBER",
      entity: "Project",
      entityId: project._id,
      changes: { addedMember: { userId, role } },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.status(200).json({
      success: true,
      message: "A'zo qo'shildi",
      data: project,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "A'zo qo‘shishda xatolik",
      error: error.message,
    });
  }
};

/* ================================
   REMOVE MEMBER (NEW)
================================ */
exports.removeMember = async (req, res) => {
  try {
    const { userId } = req.body;

    const project = await Project.findById(req.params.id);
    if (!project)
      return res.status(404).json({
        success: false,
        message: "Loyiha topilmadi",
      });

    // MANAGER → faqat o‘z departmentidagi projectdan
    if (req.user.role.name === "MANAGER") {
      if (project.department.toString() !== req.user.department.toString()) {
        return res.status(403).json({
          success: false,
          message: "Boshqa bo‘lim loyihasidan a'zo olib tashlay olmaysiz",
        });
      }
    }

    project.members = project.members.filter(
      (m) => m.user.toString() !== userId
    );
    await project.save();

    await AuditLog.create({
      user: req.user._id,
      action: "REMOVE_PROJECT_MEMBER",
      entity: "Project",
      entityId: project._id,
      changes: { removedMember: userId },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.status(200).json({
      success: true,
      message: "A'zo o'chirildi",
      data: project,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "A'zo o'chirishda xatolik",
      error: error.message,
    });
  }
};
