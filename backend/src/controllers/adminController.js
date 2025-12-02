const User = require("../models/User");
const Role = require("../models/Role");
const Project = require("../models/Project");
const Task = require("../models/Task");
const Department = require("../models/Department");
const Team = require("../models/Team");
const AuditLog = require("../models/AuditLog");
const asyncHandler = require("express-async-handler");

exports.getSystemStats = asyncHandler(async (req, res) => {
  const [
    totalUsers,
    activeUsers,
    inactiveUsers,
    totalProjects,
    activeProjects,
    completedProjects,
    totalTasks,
    completedTasks,
    totalDepartments,
    totalTeams,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ isActive: true }),
    User.countDocuments({ isActive: false }),
    Project.countDocuments(),
    Project.countDocuments({ status: "ACTIVE" }),
    Project.countDocuments({ status: "COMPLETED" }),
    Task.countDocuments(),
    Task.countDocuments({ status: "DONE" }),
    Department.countDocuments({ isActive: true }),
    Team.countDocuments({ isActive: true }),
  ]);

  const usersByRole = await User.aggregate([
    {
      $group: {
        _id: "$role",
        count: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from: "roles",
        localField: "_id",
        foreignField: "_id",
        as: "roleInfo",
      },
    },
    {
      $unwind: "$roleInfo",
    },
    {
      $project: {
        roleName: "$roleInfo.name",
        count: 1,
      },
    },
  ]);

  const projectsByStats = await Project.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  const tasksByStatus = await Task.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  // oxirgi 7kunlik faollik
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recentActivity = await AuditLog.aggregate([
    {
      $match: {
        timestamp: { $gte: sevenDaysAgo },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$timestamp" },
        },
        count: { $sum: 1 },
      },
    },
    {
      $sort: { _id: 1 },
    },
  ]);

  res.status(200).json({
    success: true,
    data: {
      users: {
        total: totalUsers,
        active: activeUsers,
        inactive: inactiveUsers,
        byRole: usersByRole,
      },
      projects: {
        total: totalProjects,
        active: activeProjects,
        completed: completedProjects,
        byStatus: projectsByStats,
      },
      tasks: {
        total: totalTasks,
        completed: completedTasks,
        completionRate:
          totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(2) : 0,
        byStatus: tasksByStatus,
      },
      departments: totalDepartments,
      teams: totalTeams,
      recentActivity,
    },
  });
});

exports.bulkActivateUsers = asyncHandler(async (req, res) => {
  const { userIds } = req.body;

  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
    return res.status(400).json({
      success: false,
      message: "userIds array majburiy",
    });
  }

  const result = await User.updateMany(
    { _id: { $in: userIds } },
    { $set: { isActive: true } }
  );

  await AuditLog.create({
    user: req.user._id,
    action: "BULK_ACTIVATE_USERS",
    entity: "User",
    entityId: req.user._id,
    changes: { userIds, count: result.modifiedCount },
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
  });

  res.status(200).json({
    success: true,
    message: `${result.modifiedCount} ta foydalanuvchi faollashtirildi`,
    data: result,
  });
});

exports.bulkDeactivateUsers = asyncHandler(async (req, res) => {
  const { userIds } = req.body;

  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
    return res.status(400).json({
      success: false,
      message: "userIds array majburiy",
    });
  }

  // O'zini deactivate qilmaslik
  if (userIds.includes(req.user._id.toString())) {
    return res.status(400).json({
      success: false,
      message: "O'zingizni deactivate qila olmaysiz",
    });
  }

  const result = await User.updateMany(
    { _id: { $in: userIds } },
    { $set: { isActive: false } }
  );

  await AuditLog.create({
    user: req.user._id,
    action: "BULK_DEACTIVATE_USERS",
    entity: "User",
    entityId: req.user._id,
    changes: { userIds, count: result.modifiedCount },
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
  });

  res.status(200).json({
    success: true,
    message: `${result.modifiedCount} ta foydalanuvchi o'chirildi`,
    data: result,
  });
});

exports.bulkDeleteUsers = asyncHandler(async (req, res) => {
  const { userIds } = req.body;

  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
    return res.status(400).json({
      success: false,
      message: "userIds array majburiy",
    });
  }

  // O'zini o'chirmaslik
  if (userIds.includes(req.user._id.toString())) {
    return res.status(400).json({
      success: false,
      message: "O'zingizni o'chira olmaysiz",
    });
  }

  const result = await User.deleteMany({ _id: { $in: userIds } });

  await AuditLog.create({
    user: req.user._id,
    action: "BULK_DELETE_USERS",
    entity: "User",
    entityId: req.user._id,
    changes: { userIds, count: result.deletedCount },
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
  });

  res.status(200).json({
    success: true,
    message: `${result.deletedCount} ta foydalanuvchi butunlay o'chirildi`,
    data: result,
  });
});

exports.getAllRoles = asyncHandler(async (req, res) => {
  const roles = await Role.find().sort({ name: 1 });

  res.status(200).json({
    success: true,
    data: roles,
  });
});

exports.updateRole = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { permissions, description } = req.body;

  const role = await Role.findById(id);

  if (!role) {
    return res.status(404).json({
      success: false,
      message: "Rol topilmadi",
    });
  }

  if (role.name === "ADMIN" && req.body.name) {
    return res.status(400).json({
      success: false,
      message: "ADMIN rol nomini o'zgartirish mumkin emas",
    });
  }

  const oldRole = role.toJSON();

  if (permissions) {
    role.permissions = permissions;
  }
  if (description) {
    role.description = description;
  }

  await role.save();

  await AuditLog.create({
    user: req.user._id,
    action: "UPDATE_ROLE",
    entity: "Role",
    entityId: role._id,
    changes: { old: oldRole, new: role.toJSON() },
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
  });

  res.status(200).json({
    success: true,
    message: "Rol muvaffaqqiyatli yangilandi",
    data: role,
  });
});

exports.getSystemSettings = asyncHandler(async (req, res) => {
  const settings = {
    general: {
      siteName: "Project Management System",
      timeZone: "Asia/Tashkent",
      language: "uz",
    },
    security: {
      sessionTimeout: 3600000, // 1 hour
      maxLoginAttempts: 5,
      passwordMinLength: 8,
    },
    notifications: {
      emailEnabled: true,
      smsEnabled: false,
    },
  };

  res.status(200).json({
    success:true,
    data:settings
  })
});

exports.cleanupInactiveUsers = asyncHandler(async (req,res) => {
    const {days = 90} = req.query

    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(days) )

    const result = await User.deleteMany({
        isActive:false,
        updatedAt:{$lt:cutoffDate}
    })

    await AuditLog.create({
        user: req.user._id,
    action: "CLEANUP_INACTIVE_USERS",
    entity: "User",
    entityId: req.user._id,
    changes: { days, deletedCount: result.deletedCount },
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"]
    })

    res.status(200).json({
        success:true,
        message:`${result.deletedCount} ta nofaol foydalanuvchi o'chirildi`,
        data:{deletedCount:result.deletedCount}
    })
})

exports.cleanupOldAuditLogs = asyncHandler(async (req, res) => {
  const { days = 365 } = req.query;

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));

  const result = await AuditLog.deleteMany({
    timestamp: { $lt: cutoffDate }
  });

  await AuditLog.create({
    user: req.user._id,
    action: "CLEANUP_AUDIT_LOGS",
    entity: "AuditLog",
    entityId: req.user._id,
    changes: { days, deletedCount: result.deletedCount },
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"]
  });

  res.status(200).json({
    success: true,
    message: `${result.deletedCount} ta eski log o'chirildi`,
    data: { deletedCount: result.deletedCount }
  });
});
