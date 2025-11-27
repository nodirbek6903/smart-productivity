const AuditLog = require("../models/AuditLog");

exports.getAuditLogs = async (req, res) => {
  try {
    const { user, action, start, end, limit = 50, page = 1 } = req.query;

    const filter = {};

    if (user) filter.user = user;
    if (action) filter.action = action;

    if (start || end) {
      filter.createdAt = {};
      if (start) filter.createdAt.$gte = new Date(start);
      if (end) filter.createdAt.$lte = new Date(end);
    }

    const logs = await AuditLog.find(filter)
      .populate("user", "fullName email role")
      .limit(Number(limit))
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await AuditLog.countDocuments(filter);

    return res.json({
      success: true,
      total,
      page: Number(page),
      limit: Number(limit),
      data: logs,
    });
  } catch (error) {
     console.error("getAuditLogs error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};
