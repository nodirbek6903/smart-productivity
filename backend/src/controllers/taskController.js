const Task = require("../models/Task");
const Project = require("../models/Project");
const Notification = require("../models/Notification");
const AuditLog = require("../models/AuditLog");
const fs = require("fs");

exports.getAllTasks = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, priority, project, assignedTo, search } = req.query;

    const filter = { isActive: true };

    // USER → faqat o'z vazifalari
    if (req.user.role.name === "USER") {
      filter.assignedTo = req.user._id;
    }

    // MANAGER → faqat o‘z bo‘limi projectlariga tegishli tasklar
    if (req.user.role.name === "MANAGER") {
      const departmentProjects = await Project.find({
        department: req.user.department,
      }).select("_id");

      filter.project = { $in: departmentProjects.map((p) => p._id) };
    }

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (project) filter.project = project;
    if (assignedTo) filter.assignedTo = assignedTo;

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;

    const tasks = await Task.find(filter)
      .populate("project", "name code department")
      .populate("assignedTo", "fullName email avatar")
      .populate("createdBy", "fullName email")
      .limit(parseInt(limit))
      .skip(skip)
      .sort({ createdAt: -1 });

    const total = await Task.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        tasks,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: parseInt(limit),
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Vazifalarni olishda xatolik", error: error.message });
  }
};

exports.getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate("project", "name code department manager")
      .populate("assignedTo", "fullName email avatar department")
      .populate("createdBy", "fullName email")
      .populate("dependencies", "title status")
      .populate("parentTask", "title status");

    if (!task) {
      return res.status(404).json({ success: false, message: "Vazifa topilmadi" });
    }

    const isAdmin = req.user.role.name === "ADMIN";
    const isAssigned = task.assignedTo?._id.toString() === req.user._id.toString();
    const isDepartmentManager =
      req.user.role.name === "MANAGER" &&
      task.project.department.toString() === req.user.department.toString();

    if (!isAdmin && !isAssigned && !isDepartmentManager) {
      return res.status(403).json({
        success: false,
        message: "Bu vazifani ko'rishga ruxsatingiz yo'q",
      });
    }

    res.status(200).json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({ success: false, message: "Vazifani olishda xatolik", error: error.message });
  }
};

/* =============================
   CREATE TASK
================================ */
exports.createTask = async (req, res) => {
  try {
    const taskData = {
      ...req.body,
      createdBy: req.user._id,
    };

    const project = await Project.findById(taskData.project);
    if (!project) {
      return res.status(404).json({ success: false, message: "Loyiha topilmadi" });
    }

    // RBAC: MANAGER → faqat o‘z departmentidagi projectga task yarata oladi
    if (req.user.role.name === "MANAGER") {
      if (project.department.toString() !== req.user.department.toString()) {
        return res.status(403).json({
          success: false,
          message: "Boshqa bo‘lim loyihasiga vazifa qo‘sha olmaysiz",
        });
      }
    }

    const task = await Task.create(taskData);

    await task.populate([
      { path: "project", select: "name code" },
      { path: "assignedTo", select: "fullName email avatar" },
      { path: "createdBy", select: "fullName email" },
    ]);

    // Notification
    await Notification.create({
      recipient: task.assignedTo,
      sender: req.user._id,
      type: "TASK_ASSIGNED",
      title: "Yangi vazifa tayinlandi",
      message: `"${task.title}" vazifasi sizga tayinlandi`,
      relatedEntity: { entityType: "Task", entityId: task._id },
    });

    // Audit Log
    await AuditLog.create({
      user: req.user._id,
      action: "CREATE_TASK",
      entity: "Task",
      entityId: task._id,
      changes: { created: task.toJSON() },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.status(201).json({ success: true, message: "Vazifa yaratildi", data: task });
  } catch (error) {
    res.status(500).json({ success: false, message: "Vazifa yaratishda xatolik", error: error.message });
  }
};

/* =============================
   UPDATE TASK
================================ */
exports.updateTask = async (req, res) => {
  try {
    const updates = req.body;

    const task = await Task.findById(req.params.id).populate("project", "department");
    if (!task) {
      return res.status(404).json({ success: false, message: "Task topilmadi" });
    }

    const oldData = task.toJSON();

    // RBAC
    const isAdmin = req.user.role.name === "ADMIN";
    const isAssignee = task.assignedTo?.toString() === req.user._id.toString();
    const isManagerDepartment =
      req.user.role.name === "MANAGER" &&
      task.project.department.toString() === req.user.department.toString();

    if (!isAdmin && !isAssignee && !isManagerDepartment) {
      return res.status(403).json({
        success: false,
        message: "Bu vazifani yangilashga ruxsatingiz yo'q",
      });
    }

    Object.assign(task, updates);

    if (task.status === "DONE" && !task.completedAt) {
      task.completedAt = new Date();
    }

    await task.save();

    await AuditLog.create({
      user: req.user._id,
      action: "UPDATE_TASK",
      entity: "Task",
      entityId: task._id,
      changes: { old: oldData, new: task.toJSON() },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.status(200).json({ success: true, message: "Task yangilandi", data: task });
  } catch (error) {
    res.status(500).json({ success: false, message: "Task yangilashda xatolik", error: error.message });
  }
};

/* =============================
   DELETE TASK (SOFT DELETE)
================================ */
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate("project", "department");

    if (!task) {
      return res.status(404).json({ success: false, message: "Task topilmadi" });
    }

    // RBAC
    const isAdmin = req.user.role.name === "ADMIN";
    const isManagerDepartment =
      req.user.role.name === "MANAGER" &&
      task.project.department.toString() === req.user.department.toString();

    if (!isAdmin && !isManagerDepartment) {
      return res.status(403).json({
        success: false,
        message: "Bu vazifani o'chira olmaysiz",
      });
    }

    task.isActive = false;
    await task.save();

    await AuditLog.create({
      user: req.user._id,
      action: "DELETE_TASK",
      entity: "Task",
      entityId: task._id,
      changes: { deleted: task.toJSON() },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.status(200).json({ success: true, message: "Vazifa o'chirildi" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Vazifani o'chirishda xatolik", error: error.message });
  }
};

/* =============================
   UPDATE TASK STATUS
================================ */
exports.updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const task = await Task.findById(req.params.id).populate("project", "manager department");
    if (!task) {
      return res.status(404).json({ success: false, message: "Vazifa topilmadi" });
    }

    const oldStatus = task.status;

    // RBAC
    const isAdmin = req.user.role.name === "ADMIN";
    const isAssignee = task.assignedTo?.toString() === req.user._id.toString();
    const isManagerDepartment =
      req.user.role.name === "MANAGER" &&
      task.project.department.toString() === req.user.department.toString();

    if (!isAdmin && !isAssignee && !isManagerDepartment) {
      return res.status(403).json({ success: false, message: "Statusni o‘zgartirishga ruxsat yo‘q" });
    }

    task.status = status;

    if (status === "DONE") {
      task.completedAt = new Date();
    }

    await task.save();

    // Notification
    if (status === "DONE") {
      await Notification.create({
        recipient: task.project.manager,
        sender: req.user._id,
        type: "TASK_COMPLETED",
        title: "Vazifa bajarildi",
        message: `"${task.title}" vazifasi bajarildi`,
        relatedEntity: { entityType: "Task", entityId: task._id },
      });
    }

    await AuditLog.create({
      user: req.user._id,
      action: "UPDATE_TASK_STATUS",
      entity: "Task",
      entityId: task._id,
      changes: { oldStatus, newStatus: status },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.status(200).json({ success: true, message: "Status yangilandi", data: task });
  } catch (error) {
    res.status(500).json({ success: false, message: "Statusni yangilashda xatolik", error: error.message });
  }
};

/* =============================
   SUBTASK MANAGEMENT
================================ */
exports.addSubtask = async (req, res) => {
  try {
    const { subtaskId } = req.body;

    const task = await Task.findById(req.params.id);
    const subtask = await Task.findById(subtaskId);

    if (!task || !subtask) {
      return res.status(404).json({ success: false, message: "Vazifa topilmadi" });
    }

    subtask.parentTask = task._id;
    await subtask.save();

    await AuditLog.create({
      user: req.user._id,
      action: "ADD_SUBTASK",
      entity: "Task",
      entityId: task._id,
      changes: { subtaskId },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.status(200).json({ success: true, message: "Subtask qo'shildi", data: subtask });
  } catch (error) {
    res.status(500).json({ success: false, message: "Subtask qo'shishda xatolik", error: error.message });
  }
};

exports.removeSubtask = async (req, res) => {
  try {
    const { subtaskId } = req.body;

    const subtask = await Task.findById(subtaskId);
    if (!subtask) {
      return res.status(404).json({ success: false, message: "Subtask topilmadi" });
    }

    subtask.parentTask = null;
    await subtask.save();

    await AuditLog.create({
      user: req.user._id,
      action: "REMOVE_SUBTASK",
      entity: "Task",
      entityId: subtask._id,
      changes: { removed: subtaskId },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.status(200).json({ success: true, message: "Subtask olib tashlandi", data: subtask });
  } catch (error) {
    res.status(500).json({ success: false, message: "Subtask remove xatolik", error: error.message });
  }
};

/* =============================
   DEPENDENCY MANAGEMENT
================================ */
exports.addDependency = async (req, res) => {
  try {
    const { dependencyId } = req.body;

    const task = await Task.findById(req.params.id);
    const dep = await Task.findById(dependencyId);

    if (!task || !dep) {
      return res.status(404).json({ success: false, message: "Vazifa topilmadi" });
    }

    if (task.dependencies.includes(dependencyId)) {
      return res.status(400).json({
        success: false,
        message: "Bu vazifa allaqachon dependency sifatida qo'shilgan",
      });
    }

    task.dependencies.push(dependencyId);
    await task.save();

    await AuditLog.create({
      user: req.user._id,
      action: "ADD_DEPENDENCY",
      entity: "Task",
      entityId: task._id,
      changes: { dependencyId },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.status(200).json({ success: true, message: "Dependency qo'shildi", data: task });
  } catch (error) {
    res.status(500).json({ success: false, message: "Dependency xatolik", error: error.message });
  }
};

exports.removeDependency = async (req, res) => {
  try {
    const { dependencyId } = req.body;

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: "Vazifa topilmadi" });
    }

    task.dependencies = task.dependencies.filter((d) => d.toString() !== dependencyId);
    await task.save();

    await AuditLog.create({
      user: req.user._id,
      action: "REMOVE_DEPENDENCY",
      entity: "Task",
      entityId: task._id,
      changes: { removed: dependencyId },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.status(200).json({ success: true, message: "Dependency olib tashlandi", data: task });
  } catch (error) {
    res.status(500).json({ success: false, message: "Xatolik", error: error.message });
  }
};

/* =============================
   ATTACHMENT MANAGEMENT
================================ */
exports.uploadAttachment = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Fayl topilmadi" });
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: "Task topilmadi" });
    }

    task.attachments.push({
      filename: req.file.filename,
      path: req.file.path,
      size: req.file.size,
      mimetype: req.file.mimetype,
    });

    await task.save();

    await AuditLog.create({
      user: req.user._id,
      action: "UPLOAD_ATTACHMENT",
      entity: "Task",
      entityId: task._id,
      changes: { file: req.file.filename },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.status(200).json({
      success: true,
      message: "Fayl yuklandi",
      data: task,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Fayl yuklashda xatolik", error: error.message });
  }
};

exports.deleteAttachment = async (req, res) => {
  try {
    const { fileId } = req.params;

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: "Task topilmadi" });
    }

    const file = task.attachments.id(fileId);
    if (!file) {
      return res.status(404).json({ success: false, message: "Fayl topilmadi" });
    }

    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }

    file.remove();
    await task.save();

    await AuditLog.create({
      user: req.user._id,
      action: "DELETE_ATTACHMENT",
      entity: "Task",
      entityId: task._id,
      changes: { removedFile: file.filename },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.status(200).json({ success: true, message: "Attachment o'chirildi" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Attachment delete xatolik", error: error.message });
  }
};
