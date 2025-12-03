const Task = require("../models/Task");
const TimeLog = require("../models/Timelog");
const User = require("../models/User");
const { Parser } = require("json2csv");
const mongoose = require("mongoose");

function parseDateRange(qstart, qend) {
  let start = qstart ? new Date(qstart) : new Date(0);
  let end = qend ? new Date(qend) : new Date();

  if (isNaN(start)) {
    start = new Date(0);
  }
  if (isNaN(end)) {
    end = new Date();
  }
  return { start, end };
}

exports.getProductivityReport = async (req, res) => {
  try {
    const { start, end } = parseDateRange(req.query.start, req.query.end);
    // match tasks completed in range
    const match = {
      status: "DONE",
      completedAt: { $gte: start, $lte: end },
    };

    // USER → faqat o'z tasklari
    if (req.user.role.name === "USER") {
      match.assignedTo = req.user._id;
    }

    // MANAGER → o'z bo‘limi userlari
    if (req.user.role.name === "MANAGER") {
      const departmentUsers = await User.find({
        department: req.user.department,
      }).select("_id");

      match.assignedTo = { $in: departmentUsers.map((u) => u._id) };
    }

    const agg = [
      { $match: match },
      {
        $group: {
          _id: "$assignedTo",
          tasksCompleted: { $sum: 1 },
          avgCompletionsMs: {
            $avg: { $subtract: ["$completedAt", "$createdAt"] },
          },
          tasks: {
            $push: { id: "$_id", title: "$title", completedAt: "$completedAt" },
          },
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
          userId: "$user._id",
          name: { $ifNull: ["$user.name", "$user.email"] },
          email: "$user.email",
          tasksCompleted: 1,
          avgCompletionHours: {
            $round: [{ $divide: ["$avgCompletionMs", 1000 * 60 * 60] }, 2],
          },
          tasks: 1,
        },
      },
      { $sort: { tasksCompleted: -1 } },
    ];

    const result = await Task.aggregate(agg).allowDiskUse(true);

    if ((req.query.format || "").toLowerCase() === "csv") {
      const flat = [];
      result.forEach((r) => {
        flat.push({
          userId: r.userId ? r.userId.toString() : "",
          name: r.name || "",
          email: r.email || "",
          tasksCompleted: r.tasksCompleted,
          avgCompletionHours: r.avgCompletionHours,
        });
      });
      const parser = new Parser();
      const csv = parser.parse(flat);
      res.header("Content-Type", "text/csv");
      res.attachment(
        `productivity_${start.toISOString().slice(0, 10)}_${end
          .toISOString()
          .slice(0, 10)}.csv`
      );
      return res.send(csv);
    }

    return res.json({ success: true, data: result });
  } catch (error) {
    console.error("getProductivityReport err:", error);
    return res.status(500).json({ success: false, message: "Server xatosi" });
  }
};

exports.getTimeSheetReport = async (req, res) => {
  try {
    const { start, end } = parseDateRange(req.query.start, req.query.end);
    const groupBy = (req.query.groupBy || "user").toLowerCase(); // user or project

    const match = {
      startTime: { $lte: end },
      $or: [
        { endTime: { $gte: start } },
        { endTime: null }, // ongoing logs
      ],
    };

    // USER → faqat o'z time-loglari
    if (req.user.role.name === "USER") {
      match.user = req.user._id;
    }

    // MANAGER → bo‘limidagi odamlar time-loglari
    if (req.user.role.name === "MANAGER") {
      const deptUsers = await User.find({
        department: req.user.department,
      }).select("_id");

      match.user = { $in: deptUsers.map((u) => u._id) };
    }

    const groupId = groupBy === "project" ? "$project" : "$user";

    const agg = [
      { $match: match },
      {
        $group: {
          _id: groupId,
          totalMinutes: { $sum: "$duration" },
          entries: {
            $push: {
              id: "$_id",
              user: "$user",
              project: "$project",
              duration: "$duration",
              startTime: "$startTime",
              endTime: "$endTime",
            },
          },
        },
      },
    ];

    // populate user/project info depending
    const raw = await TimeLog.aggregate(agg).allowDiskUse(true);

    // If grouping by user, lookup user info. If project, lookup project info.
    if (groupBy === "user") {
      // populate user
      const userIds = raw.map((r) => r._id).filter(Boolean);
      const users = await User.find({ _id: { $in: userIds } })
        .select("name email")
        .lean();
      const usersMap = {};
      users.forEach((u) => (usersMap[u._id.toString()] = u));
      const out = raw.map((r) => ({
        id: r._id ? r._id.toString() : null,
        name: usersMap[r._id?.toString()]?.name || "",
        email: usersMap[r._id?.toString()]?.email || "",
        totalMinutes: r.totalMinutes,
        totalHours: +(r.totalMinutes / 60).toFixed(2),
        entriesCount: (r.entries || []).length,
      }));
      if ((req.query.format || "").toLowerCase() === "csv") {
        const parser = new Parser();
        const csv = parser.parse(out);
        res.header("Content-Type", "text/csv");
        res.attachment(
          `timesheet_user_${start.toISOString().slice(0, 10)}_${end
            .toISOString()
            .slice(0, 10)}.csv`
        );
        return res.send(csv);
      }
      return res.json({ success: true, data: out });
    } else {
      // groupBy project -> just format raw
      const out = raw.map((r) => ({
        projectId: r._id ? r._id.toString() : null,
        totalMinutes: r.totalMinutes,
        totalHours: +(r.totalMinutes / 60).toFixed(2),
        entriesCount: (r.entries || []).length,
      }));
      if ((req.query.format || "").toLowerCase() === "csv") {
        const parser = new Parser();
        const csv = parser.parse(out);
        res.header("Content-Type", "text/csv");
        res.attachment(
          `timesheet_project_${start.toISOString().slice(0, 10)}_${end
            .toISOString()
            .slice(0, 10)}.csv`
        );
        return res.send(csv);
      }
      return res.json({ success: true, data: out });
    }
  } catch (error) {
    console.error("getTimeSheetReport err:", error);
    return res.status(500).json({ success: false, message: "Server xatosi" });
  }
};
