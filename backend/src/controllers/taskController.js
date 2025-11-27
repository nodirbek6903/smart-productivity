const Task = require("../models/Task");
const Project = require("../models/Project");
const Notification = require("../models/Notification");
const AuditLog = require("../models/AuditLog");
const fs = require("fs");

exports.getAllTasks = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      priority,
      project,
      assignedTo,
      search,
    } = req.query;

    const filter = { isActive: true };

    // Faqat o'z vazifalarini ko'rish (USER uchun)
    if (req.user.role.name === "USER") {
      filter.assignedTo = req.user._id;
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
      .populate("project", "name code")
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
    res.status(500).json({
      success: false,
      message: "Vazifalarni olishda xatolik",
      error: error.message,
    });
  }
};

exports.getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate("project", "name code")
      .populate("assignedTo", "fullName email avatar")
      .populate("createdBy", "fullName email")
      .populate("dependencies", "title status")
      .populate("parentTask", "title status");

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Vazifa topilmadi",
      });
    }

    res.status(200).json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Vazifani olishda xatolik",
      error: error.message,
    });
  }
};

exports.createTask = async (req, res) => {
  try {
    const taskData = {
      ...req.body,
      createdBy: req.user._id,
    };

    // Loyiha mavjudligini tekshirish
    const project = await Project.findById(taskData.project);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Loyiha topilmadi",
      });
    }

    const task = await Task.create(taskData);
    await task.populate([
      { path: "project", select: "name code" },
      { path: "assignedTo", select: "fullName email avatar" },
      { path: "createdBy", select: "fullName email" },
    ]);

    // Notification yaratish
    await Notification.create({
      recipient: task.assignedTo._id,
      sender: req.user._id,
      type: "TASK_ASSIGNED",
      title: "Yangi vazifa tayinlandi",
      message: `"${task.title}" vazifasi sizga tayinlandi`,
      relatedEntity: {
        entityType: "Task",
        entityId: task._id,
      },
    });

    // Audit log
    await AuditLog.create({
      user: req.user._id,
      action: "CREATE_TASK",
      entity: "Task",
      entityId: task._id,
      changes: { created: task.toJSON() },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.status(201).json({
      success: true,
      message: "Vazifa muvaffaqiyatli yaratildi",
      data: task,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Vazifa yaratishda xatolik",
      error: error.message,
    });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const updates = req.body;

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res
        .status(404)
        .json({ success: false, message: "Task topilmadi" });
    }

    const oldData = task.toJSON();

    Object.keys(updates).forEach((key) => {
      task[key] = updates[key];
    });

    if (task.status === "DONE" && !task.completedAt) {
      task.completedAt = new Date();
    }

    await task.save();

    await task.populate([
      { path: "project", select: "name code" },
      { path: "assignedTo", select: "fullName email avatar" },
      { path: "createdBy", select: "fullName email" },
    ]);

    await AuditLog.create({
      user: req.user._id,
      action: "UPDATE_TASK",
      entity: "Task",
      entityId: task._id,
      changes: {
        old: oldData,
        new: task.toJSON(),
      },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.status(200).json({
      success: true,
      message: "Vazifa muvaffaqqiyatli yangilandi",
      data: task,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Vazifani yangilashda xatolik",
      error: error.message,
    });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task topilmadi",
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

    res
      .status(200)
      .json({ success: true, message: "Vazifa muvaffaqqiyatli o'chirildi" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Vazifani o'chirishda xatolik",
      error: error.message,
    });
  }
};

exports.updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Vazifa topilmadi",
      });
    }

    const oldStatus = task.status;
    task.status = status;

    if (status === "DONE") {
      task.completedAt = new Date();
    }

    await task.save();
    await task.populate([
      { path: "project", select: "name code manager" },
      { path: "assignedTo", select: "fullName email" },
    ]);

    // Project manager ga notification
    if (status === "DONE") {
      await Notification.create({
        recipient: task.project.manager,
        sender: req.user._id,
        type: "TASK_COMPLETED",
        title: "Vazifa bajarildi",
        message: `"${task.title}" vazifasi bajarildi`,
        relatedEntity: {
          entityType: "Task",
          entityId: task._id,
        },
      });
    }

    res.status(200).json({
      success: true,
      message: "Status muvaffaqiyatli yangilandi",
      data: task,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Statusni yangilashda xatolik",
      error: error.message,
    });
  }
};

exports.addSubtask = async (req, res) => {
  try {
    const { subtaskId } = req.body;

    const task = await Task.findById(req.params.id);
    const subtask = await Task.findById(subtaskId);

    if (!task || !subtask) {
      return res.status(404).json({
        success: false,
        message: "Vazifa yoki subtask topilmadi",
      });
    }

    subtask.parentTask = task._id;
    await subtask.save();

    res.status(200).json({
      success: true,
      message: "Subtask muvaffaqqiyatli qo'shildi",
      data: subtask,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "subtask qo'shishda xatolik",
      error: error.message,
    });
  }
};

exports.removeSubtask = async (req, res) => {
  try {
    const { subtaskId } = req.body;

    const subtask = await Task.findById(subtaskId);

    if (!subtask) {
      return res.status(404).json({
        success: false,
        message: "Subtask topilmadi",
      });
    }

    subtask.parentTask = null;
    await subtask.save();

    res.status(200).json({
      success: true,
      message: "Subtask olib tashlandi",
      data: subtask,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Subtask remove qilishda xatolik",
      error: error.message,
    });
  }
};

exports.addDependency = async (req, res) => {
  try {
    const { dependencyId } = req.body;

    const task = await Task.findById(req.params.id);

    const dep = await Task.findById(dependencyId);

    if (!task || !dep) {
      return res
        .status(404)
        .json({ success: false, message: "Vazifa topilmadi" });
    }

    if (task.dependencies.includes(dependencyId)) {
      return res.status(400).json({
        success: false,
        message: "Bu vazifa allaqachon dependency sifatida qo'shilgan",
      });
    }

    task.dependencies.push(dependencyId);
    await task.save();

    res.status(200).json({
      success: true,
      message: "Dependency qo'shildi",
      data: task,
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Xatolik", error: error.message });
  }
};

exports.removeDependency = async (req, res) => {
  try {
    const { dependencyId } = req.body;

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res
        .status(404)
        .json({ success: false, message: "Vazifa topilmadi" });
    }

    task.dependencies = task.dependencies.filter(
      (dep) => dep.toString() !== dependencyId
    );
    await task.save();

    res.status(200).json({
      success: true,
      message: "Dependency olib tashlandi",
      data: task,
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Xatolik", error: error.message });
  }
};

exports.uploadAttachment = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Fayl topilmadi",
      });
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res
        .status(404)
        .json({ success: false, message: "Task topilmadi" });
    }

    task.attachments.push({
      filename: req.file.filename,
      path: req.file.path,
      size: req.file.size,
      mimetype: req.file.mimetype,
    });

    await task.save();

    res.status(200).json({
      success: true,
      message: "Fayl muvaffaqqiyatli yuklandi",
      data: task,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "uploadAttachment xatolik",
      error: error.message,
    });
  }
};

exports.deleteAttachment = async (req, res) => {
  try {
    const { fileId } = req.params;

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res
        .status(404)
        .json({ success: false, message: "Task topilmadi" });
    }

    const file = task.attachments.id(fileId);
    if (!file) {
      return res
        .status(404)
        .json({ success: false, message: "Fayl topilmadi" });
    }

    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }

    file.remove();
    await task.save();

    res
      .status(200)
      .json({
        success: true,
        message: "Attachment muvaffaqqiyatli o'chirildi",
      });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Xatolik", error: error.message });
  }
};
