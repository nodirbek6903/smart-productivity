const Task = require("../models/Task")
const Project = require("../models/Project")
const TimeLog = require("../models/Timelog")
const Notification = require("../models/Notification")
const asyncHandler = require("express-async-handler")

// ============ ADMIN DASHBOARD ============
exports.getAdminDashboard = asyncHandler(async (req, res) => {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));

  const [
    totalProjects,
    activeProjects,
    totalTasks,
    completedTasks,
    overdueTasks,
    totalTime,
    thisMonthTime,
    recentActivities
  ] = await Promise.all([
    Project.countDocuments({ isActive: true }),
    Project.countDocuments({ status: "ACTIVE" }),
    Task.countDocuments({ isActive: true }),
    Task.countDocuments({ status: "DONE" }),
    Task.countDocuments({ status: { $ne: "DONE" }, dueDate: { $lt: now } }),
    TimeLog.aggregate([{ $group: { _id: null, total: { $sum: "$duration" } } }]),
    TimeLog.aggregate([
      { $match: { createdAt: { $gte: monthStart } } },
      { $group: { _id: null, total: { $sum: "$duration" } } }
    ]),
    require("../models/AuditLog").find().sort({ timestamp: -1 }).limit(10)
  ]);

  const projectsByStatus = await Project.aggregate([
    { $group: { _id: "$status", count: { $sum: 1 } } }
  ]);

  const tasksByPriority = await Task.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: "$priority", count: { $sum: 1 } } }
  ]);

  res.status(200).json({
    success: true,
    data: {
      summary: {
        projects: totalProjects,
        activeProjects,
        tasks: totalTasks,
        completedTasks,
        completionRate: totalTasks ? ((completedTasks / totalTasks) * 100).toFixed(1) : 0,
        overdueTasks,
        totalTimeLogged: (totalTime[0]?.total / 60).toFixed(1) + " soat",
        thisMonthTime: (thisMonthTime[0]?.total / 60).toFixed(1) + " soat"
      },
      projectsByStatus,
      tasksByPriority,
      recentActivities: recentActivities.map(a => ({
        action: a.action,
        entity: a.entity,
        user: a.user,
        timestamp: a.timestamp
      }))
    }
  });
});

// ============ MANAGER DASHBOARD ============
exports.getManagerDashboard = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const now = new Date();

  // Manager's projects
  const myProjects = await Project.find({
    $or: [{ manager: userId }, { "members.user": userId }]
  }).select("_id name status");

  const projectIds = myProjects.map(p => p._id);

  const [
    myProjectsCount,
    myProjectsActive,
    myTasksCount,
    myTasksCompleted,
    myTeamTasksOverdue,
    timeLoggedThisMonth
  ] = await Promise.all([
    Project.countDocuments({ manager: userId }),
    Project.countDocuments({ manager: userId, status: "ACTIVE" }),
    Task.countDocuments({ project: { $in: projectIds }, isActive: true }),
    Task.countDocuments({ project: { $in: projectIds }, status: "DONE" }),
    Task.countDocuments({
      project: { $in: projectIds },
      status: { $ne: "DONE" },
      dueDate: { $lt: now }
    }),
    TimeLog.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(now.getFullYear(), now.getMonth(), 1) }
        }
      },
      { $group: { _id: null, total: { $sum: "$duration" } } }
    ])
  ]);

  // Team performance
  const teamPerformance = await Task.aggregate([
    { $match: { project: { $in: projectIds } } },
    {
      $group: {
        _id: "$assignedTo",
        totalTasks: { $sum: 1 },
        completedTasks: {
          $sum: { $cond: [{ $eq: ["$status", "DONE"] }, 1, 0] }
        }
      }
    },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "user"
      }
    },
    { $unwind: "$user" },
    {
      $project: {
        name: "$user.fullName",
        totalTasks: 1,
        completedTasks: 1,
        completionRate: {
          $round: [
            { $multiply: [{ $divide: ["$completedTasks", "$totalTasks"] }, 100] },
            1
          ]
        }
      }
    },
    { $sort: { completionRate: -1 } }
  ]);

  res.status(200).json({
    success: true,
    data: {
      summary: {
        myProjects: myProjectsCount,
        activeProjects: myProjectsActive,
        myTasks: myTasksCount,
        completedTasks: myTasksCompleted,
        completionRate: myTasksCount ? ((myTasksCompleted / myTasksCount) * 100).toFixed(1) : 0,
        overdueTasks: myTeamTasksOverdue,
        timeLoggedThisMonth: (timeLoggedThisMonth[0]?.total / 60).toFixed(1) + " soat"
      },
      teamPerformance,
      myProjects: myProjects.map(p => ({
        id: p._id,
        name: p.name,
        status: p.status
      }))
    }
  });
});

// ============ USER DASHBOARD ============
exports.getUserDashboard = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const now = new Date();

  const [
    myTasks,
    myCompletedTasks,
    myInProgressTasks,
    overdueTasks,
    unreadNotifications,
    timeLoggedToday,
    timeLoggedThisWeek
  ] = await Promise.all([
    Task.countDocuments({ assignedTo: userId, isActive: true }),
    Task.countDocuments({ assignedTo: userId, status: "DONE" }),
    Task.countDocuments({ assignedTo: userId, status: "IN_PROGRESS" }),
    Task.countDocuments({
      assignedTo: userId,
      status: { $ne: "DONE" },
      dueDate: { $lt: now }
    }),
    Notification.countDocuments({ recipient: userId, isRead: false }),
    TimeLog.aggregate([
      {
        $match: {
          user: userId,
          startTime: {
            $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate())
          }
        }
      },
      { $group: { _id: null, total: { $sum: "$duration" } } }
    ]),
    TimeLog.aggregate([
      {
        $match: {
          user: userId,
          startTime: { $gte: new Date(now.setDate(now.getDate() - 7)) }
        }
      },
      { $group: { _id: null, total: { $sum: "$duration" } } }
    ])
  ]);

  // My upcoming tasks (due in next 7 days)
  const upcomingTasks = await Task.find({
    assignedTo: userId,
    status: { $ne: "DONE" },
    dueDate: {
      $gte: now,
      $lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    }
  })
    .populate("project", "name")
    .sort({ dueDate: 1 })
    .limit(5);

  // My recent activity
  const recentTasks = await Task.find({ assignedTo: userId })
    .sort({ updatedAt: -1 })
    .limit(5)
    .populate("project", "name");

  res.status(200).json({
    success: true,
    data: {
      summary: {
        myTasks,
        completedTasks: myCompletedTasks,
        inProgressTasks: myInProgressTasks,
        completionRate: myTasks ? ((myCompletedTasks / myTasks) * 100).toFixed(1) : 0,
        overdueTasks,
        unreadNotifications,
        timeLoggedToday: (timeLoggedToday[0]?.total || 0 / 60).toFixed(1) + " soat",
        timeLoggedThisWeek: (timeLoggedThisWeek[0]?.total || 0 / 60).toFixed(1) + " soat"
      },
      upcomingTasks: upcomingTasks.map(t => ({
        id: t._id,
        title: t.title,
        project: t.project.name,
        dueDate: t.dueDate,
        priority: t.priority
      })),
      recentTasks: recentTasks.map(t => ({
        id: t._id,
        title: t.title,
        project: t.project.name,
        status: t.status,
        updatedAt: t.updatedAt
      }))
    }
  });
});

// ============ TEAM ANALYTICS (Manager uchun) ============
exports.getTeamAnalytics = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { startDate, endDate } = req.query;

  const start = startDate ? new Date(startDate) : new Date(0);
  const end = endDate ? new Date(endDate) : new Date();

  // Manager's projects
  const projects = await Project.find({ manager: userId }).select("_id");
  const projectIds = projects.map(p => p._id);

  // Team member productivity
  const memberProductivity = await TimeLog.aggregate([
    {
      $match: {
        project: { $in: projectIds },
        startTime: { $gte: start, $lte: end }
      }
    },
    {
      $group: {
        _id: "$user",
        totalMinutes: { $sum: "$duration" },
        entriesCount: { $sum: 1 }
      }
    },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "user"
      }
    },
    { $unwind: "$user" },
    {
      $project: {
        name: "$user.fullName",
        totalHours: { $round: [{ $divide: ["$totalMinutes", 60] }, 1] },
        entriesCount: 1
      }
    },
    { $sort: { totalHours: -1 } }
  ]);

  // Project progress
  const projectProgress = await Project.aggregate([
    { $match: { _id: { $in: projectIds } } },
    {
      $lookup: {
        from: "tasks",
        localField: "_id",
        foreignField: "project",
        as: "tasks"
      }
    },
    {
      $project: {
        name: 1,
        status: 1,
        totalTasks: { $size: "$tasks" },
        completedTasks: {
          $size: {
            $filter: {
              input: "$tasks",
              as: "task",
              cond: { $eq: ["$$task.status", "DONE"] }
            }
          }
        }
      }
    },
    {
      $project: {
        name: 1,
        status: 1,
        totalTasks: 1,
        completedTasks: 1,
        progressPercentage: {
          $cond: [
            { $eq: ["$totalTasks", 0] },
            0,
            { $round: [{ $multiply: [{ $divide: ["$completedTasks", "$totalTasks"] }, 100] }, 1] }
          ]
        }
      }
    }
  ]);

  res.status(200).json({
    success: true,
    data: {
      memberProductivity,
      projectProgress,
      summary: {
        totalMembers: memberProductivity.length,
        totalHours: memberProductivity.reduce((sum, m) => sum + m.totalHours, 0).toFixed(1),
        averageHoursPerMember: (
          memberProductivity.reduce((sum, m) => sum + m.totalHours, 0) / memberProductivity.length
        ).toFixed(1),
        activeProjects: projectProgress.filter(p => p.status === "ACTIVE").length
      }
    }
  });
});

// ============ MY TASKS (USER) ============
exports.getMyTasks = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { status, priority, sort = "-dueDate" } = req.query;

  const filter = { assignedTo: userId, isActive: true };

  if (status) filter.status = status;
  if (priority) filter.priority = priority;

  const tasks = await Task.find(filter)
    .populate("project", "name code")
    .populate("createdBy", "fullName")
    .sort(sort);

  res.status(200).json({
    success: true,
    data: tasks,
    count: tasks.length
  });
});

// ============ TASK STATISTICS ============
exports.getTaskStatistics = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const stats = await Task.aggregate([
    { $match: { assignedTo: userId } },
    {
      $facet: {
        byStatus: [
          { $group: { _id: "$status", count: { $sum: 1 } } }
        ],
        byPriority: [
          { $group: { _id: "$priority", count: { $sum: 1 } } }
        ],
        averageCompletionTime: [
          {
            $match: { status: "DONE", completedAt: { $exists: true } }
          },
          {
            $project: {
              days: {
                $divide: [
                  { $subtract: ["$completedAt", "$createdAt"] },
                  1000 * 60 * 60 * 24
                ]
              }
            }
          },
          {
            $group: {
              _id: null,
              average: { $avg: "$days" }
            }
          }
        ]
      }
    }
  ]);

  res.status(200).json({
    success: true,
    data: stats[0]
  });
});