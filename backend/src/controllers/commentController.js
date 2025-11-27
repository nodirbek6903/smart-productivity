const Comment = require("../models/Comment");
const Task = require("../models/Task");
const Notification = require("../models/Notification");
const AuditLog = require("../models/AuditLog");

exports.createComment = async (req, res) => {
  try {
    const { content, parentComment } = req.body;
    const taskId = req.params.taskId;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ success: false, message: "Kommentariya bo'sh bo'lishi mumkin emas" });
    }

    const task = await Task.findById(taskId).populate("assignedTo createdBy");
    if (!task) return res.status(404).json({ success: false, message: "Vazifa topilmadi" });

    const comment = await Comment.create({
      content: content.trim(),
      task: taskId,
      author: req.user._id,
      parentComment: parentComment || null
    });

    // Create notification to task owner/manager (oddiy misol)
    const recipients = [];
    if (task.assignedTo) recipients.push(task.assignedTo);
    if (task.createdBy) recipients.push(task.createdBy);
    // remove duplicates and current user
    const recips = [...new Set(recipients.map(String))].filter(id => id !== String(req.user._id));
    await Notification.insertMany(recips.map(r => ({
      recipient: r,
      message: `Yangi kommentariya: ${content.slice(0,120)}`,
      relatedEntity: { entityType: "Comment", entityId: comment._id }
    })));

    // Audit log
    await AuditLog.create({
      actor: req.user._id,
      action: "CREATE_COMMENT",
      message: `Comment ${comment._id} created for task ${taskId}`,
      relatedEntity: { entityType: "Comment", entityId: comment._id }
    });

    return res.status(201).json({ success: true, data: comment });
  } catch (error) {
    console.error("createComment err:", error);
    return res.status(500).json({ success: false, message: "Server xatosi" });
  }
};

