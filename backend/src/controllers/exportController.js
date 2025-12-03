const Task = require("../models/Task")
const Project = require("../models/Project")
const User = require("../models/User")
const TimeLog = require("../models/Timelog")
const exportService = require("../services/exportService")
const asyncHandler = require("express-async-handler")
const fs = require("fs")
const path = require("path")


// ============ EXPORT TASKS ============
exports.exportTasks = asyncHandler(async (req, res) => {
  const { format = "excel", status, priority, project } = req.query;

  const filter = { isActive: true };

  if (req.user.role.name === "USER") {
    filter.assignedTo = req.user._id;
  }

  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (project) filter.project = project;

  const tasks = await Task.find(filter)
    .populate("project", "name")
    .populate("assignedTo", "fullName")
    .populate("createdBy", "fullName");

  if (tasks.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Eksport uchun vazifalar topilmadi",
    });
  }

  const filePath = await exportService.exportTasks(tasks, format);
  const filename = path.basename(filePath);

  res.download(filePath, filename, (err) => {
    if (err) console.error("Download error:", err);
    // Faylni o'chirish (optional)
    // fs.unlinkSync(filePath);
  });
});

// ============ EXPORT PROJECTS ============
exports.exportProjects = asyncHandler(async (req, res) => {
  const { format = "excel", status } = req.query;

  const filter = { isActive: true };

  if (req.user.role.name === "USER") {
    filter.$or = [
      { manager: req.user._id },
      { "members.user": req.user._id },
    ];
  }

  if (status) filter.status = status;

  const projects = await Project.find(filter)
    .populate("manager", "fullName")
    .populate("members.user", "fullName");

  if (projects.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Eksport uchun loyihalar topilmadi",
    });
  }

  const filePath = await exportService.exportProjects(projects, format);
  const filename = path.basename(filePath);

  res.download(filePath, filename, (err) => {
    if (err) console.error("Download error:", err);
  });
});

// ============ EXPORT TIME LOGS ============
exports.exportTimeLogs = asyncHandler(async (req, res) => {
  const { format = "excel", startDate, endDate, user } = req.query;

  const filter = {};

  if (startDate || endDate) {
    filter.startTime = {};
    if (startDate) filter.startTime.$gte = new Date(startDate);
    if (endDate) filter.startTime.$lte = new Date(endDate);
  }

  // Manager faqat o'z team'ining loglarini ko'ra oladi
  if (req.user.role.name === "MANAGER") {
    const projects = await Project.find({ manager: req.user._id }).select("_id");
    filter.project = { $in: projects.map(p => p._id) };
  }

  // User o'z loglarini ko'ra oladi
  if (req.user.role.name === "USER") {
    filter.user = req.user._id;
  }

  if (user && req.user.role.name === "ADMIN") {
    filter.user = user;
  }

  const timeLogs = await TimeLog.find(filter)
    .populate("user", "fullName")
    .populate("task", "title")
    .populate("project", "name");

  if (timeLogs.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Eksport uchun vaqt loglar topilmadi",
    });
  }

  const filePath = await exportService.exportTimeLogs(timeLogs, format);
  const filename = path.basename(filePath);

  res.download(filePath, filename, (err) => {
    if (err) console.error("Download error:", err);
  });
});

// ============ EXPORT USERS (ADMIN ONLY) ============
exports.exportUsers = asyncHandler(async (req, res) => {
  const { format = "excel", role, department, isActive } = req.query;

  const filter = {};

  if (role) filter.role = role;
  if (department) filter.department = department;
  if (isActive !== undefined) {
    filter.isActive = isActive === "true";
  }

  const users = await User.find(filter)
    .populate("role", "name")
    .populate("department", "name");

  if (users.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Eksport uchun foydalanuvchilar topilmadi",
    });
  }

  const filePath = await exportService.exportUsers(users, format);
  const filename = path.basename(filePath);

  res.download(filePath, filename, (err) => {
    if (err) console.error("Download error:", err);
  });
});

// ============ EXPORT PRODUCTIVITY REPORT ============
exports.exportProductivityReport = asyncHandler(async (req, res) => {
  const { format = "excel", startDate, endDate } = req.query;

  const start = startDate ? new Date(startDate) : new Date(0);
  const end = endDate ? new Date(endDate) : new Date();

  const match = {
    status: "DONE",
    completedAt: { $gte: start, $lte: end },
  };

  if (req.user.role.name === "USER") {
    match.assignedTo = req.user._id;
  }

  const agg = [
    { $match: match },
    {
      $group: {
        _id: "$assignedTo",
        tasksCompleted: { $sum: 1 },
        avgCompletionMs: { $avg: { $subtract: ["$completedAt", "$createdAt"] } },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "user",
      },
    },
    { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        "To'liq ism": "$user.fullName",
        "Email": "$user.email",
        "Tugallangan vazifalar": "$tasksCompleted",
        "O'rtacha vaqt (soat)": {
          $round: [{ $divide: ["$avgCompletionMs", 1000 * 60 * 60] }, 2],
        },
      },
    },
    { $sort: { "Tugallangan vazifalar": -1 } },
  ];

  const report = await Task.aggregate(agg);

  if (report.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Eksport uchun ma'lumot topilmadi",
    });
  }

  const filePath = await exportService.exportToExcel(
    report,
    `productivity_report_${new Date().toISOString().slice(0, 10)}`,
    "Samaradorlik"
  );
  const filename = path.basename(filePath);

  res.download(filePath, filename, (err) => {
    if (err) console.error("Download error:", err);
  });
});

// ============ CLEANUP OLD EXPORTS ============
exports.cleanupExports = asyncHandler(async (req, res) => {
  const { days = 7 } = req.query;

  await exportService.cleanupOldExports(parseInt(days));

  res.status(200).json({
    success: true,
    message: `${days} kundan eski eksport fayllar o'chirildi`,
  });
});