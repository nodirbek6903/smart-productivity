const Project = require("../models/Project");
const User = require("../models/User");
const AuditLog = require("../models/AuditLog");

exports.getAllProjects = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      priority,
      search,
      department,
    } = req.query;

    const filter = { isActive: true };

    if (req.user.role.name === "USER") {
      filter.$or = [
        { manager: req.user._id },
        { "members.user": req.user._id },
      ];
    }

    if (status) {
      filter.status = status;
    }
    if (priority) {
      filter.priority = priority;
    }
    if (department) {
      filter.department = department;
    }
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

exports.getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('manager', 'fullName email avatar position')
      .populate('department', 'name code description')
      .populate('members.user', 'fullName email avatar position')
      .populate({
        path: 'taskCount',
        match: { isActive: true }
      });
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Loyiha topilmadi'
      });
    }
    
    // Access tekshirish
    const isManager = project.manager._id.toString() === req.user._id.toString();
    const isMember = project.members.some(m => m.user._id.toString() === req.user._id.toString());
    const isAdmin = req.user.role.name === 'ADMIN';
    
    if (!isAdmin && !isManager && !isMember) {
      return res.status(403).json({
        success: false,
        message: 'Bu loyihaga kirishga ruxsatingiz yo\'q'
      });
    }
    
    res.status(200).json({
      success: true,
      data: project
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Loyihani olishda xatolik',
      error: error.message
    });
  }
};

exports.createProject = async (req, res) => {
  try {
    const projectData = {
      ...req.body,
      manager: req.body.manager || req.user._id
    };
    
    // Unique code yaratish
    if (!projectData.code) {
      const count = await Project.countDocuments();
      projectData.code = `PROJ-${String(count + 1).padStart(4, '0')}`;
    }
    
    const project = await Project.create(projectData);
    
    // Manager ni avtomatik member qilish
    project.members.push({
      user: project.manager,
      role: 'LEAD'
    });
    await project.save();
    
    // Populate qilish
    await project.populate('manager', 'fullName email');
    
    // Audit log
    await AuditLog.create({
      user: req.user._id,
      action: 'CREATE_PROJECT',
      entity: 'Project',
      entityId: project._id,
      changes: { created: project.toJSON() },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    res.status(201).json({
      success: true,
      message: 'Loyiha muvaffaqiyatli yaratildi',
      data: project
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Loyiha yaratishda xatolik',
      error: error.message
    });
  }
};

exports.updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    
    const oldProject = await Project.findById(id);
    if (!oldProject) {
      return res.status(404).json({
        success: false,
        message: 'Loyiha topilmadi'
      });
    }
    
    // Faqat manager yoki admin yangilay oladi
    const isManager = oldProject.manager.toString() === req.user._id.toString();
    const isAdmin = req.user.role.name === 'ADMIN';
    
    if (!isAdmin && !isManager) {
      return res.status(403).json({
        success: false,
        message: 'Bu loyihani yangilashga ruxsatingiz yo\'q'
      });
    }
    
    const project = await Project.findByIdAndUpdate(
      id,
      { $set: req.body },
      { new: true, runValidators: true }
    ).populate('manager', 'fullName email');
    
    // Audit log
    await AuditLog.create({
      user: req.user._id,
      action: 'UPDATE_PROJECT',
      entity: 'Project',
      entityId: project._id,
      changes: { old: oldProject.toJSON(), new: project.toJSON() },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    res.status(200).json({
      success: true,
      message: 'Loyiha muvaffaqiyatli yangilandi',
      data: project
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Loyihani yangilashda xatolik',
      error: error.message
    });
  }
};  

exports.addMember = async (req, res) => {
  try {
    const { userId, role = 'MEMBER' } = req.body;
    
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Loyiha topilmadi'
      });
    }
    
    // Foydalanuvchi mavjudligini tekshirish
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Foydalanuvchi topilmadi'
      });
    }
    
    // Allaqachon member ekanini tekshirish
    const isMember = project.members.some(m => m.user.toString() === userId);
    if (isMember) {
      return res.status(400).json({
        success: false,
        message: "Foydalanuvchi allaqachon loyiha a'zosi"
      });
    }
    
    project.members.push({ user: userId, role });
    await project.save();
    
    await project.populate('members.user', 'fullName email avatar');
    
    res.status(200).json({
      success: true,
      message: "A'zo muvaffaqiyatli qo'shildi",
      data: project
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "A'zo qo'shishda xatolik",
      error: error.message
    });
  }
};
