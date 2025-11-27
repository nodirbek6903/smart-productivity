const Team = require("../models/Team")
const Department = require("../models/Department")
const User = require("../models/User")
const AuditLog = require("../models/AuditLog")


exports.createTeam = async (req,res) => {
    try {
        const {name,department,leader} = req.body

        const dept = await Department.findById(department)
        if(!dept){
            return res.status(400).json({success:false,message:"Bo'lim topilmadi"})
        }

        const leaderUser = await User.findById(leader)
        if(!leaderUser){
             return res.status(400).json({ success: false, message: "Lider topilmadi" });
        }

        const team = await Team.create({
            name,
            department,
            leader,
            members:[leader]
        })
        await AuditLog.create({
      user: req.user._id,
      action: "CREATE_TEAM",
      entity: "Team",
      entityId: team._id,
      changes: { created: team.toJSON() },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"]
    });

    res.status(201).json({ success: true,message:"Team yaratildi", data: team });
    } catch (error) {
         res.status(500).json({ success: false, message: "Jamoa yaratishda xatolik", error: error.message });
    }
}

// GET ALL TEAMS
exports.getAllTeams = async (req, res) => {
  try {
    const teams = await Team.find()
      .populate("department", "name")
      .populate("leader", "fullName email")
      .populate("members", "fullName email")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: teams });
  } catch (error) {
    res.status(500).json({ success: false, message: "Jamoalarni olishda xatolik", error: error.message });
  }
};

// GET ONE TEAM
exports.getTeamById = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate("department", "name")
      .populate("leader", "fullName email")
      .populate("members", "fullName email");

    if (!team) {
      return res.status(404).json({ success: false, message: "Jamoa topilmadi" });
    }

    res.status(200).json({ success: true, data: team });
  } catch (error) {
    res.status(500).json({ success: false, message: "Jamoani olishda xatolik", error: error.message });
  }
};

// UPDATE TEAM
exports.updateTeam = async (req, res) => {
  try {
    const updates = req.body;

    const team = await Team.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    if (!team) {
      return res.status(404).json({ success: false, message: "Jamoa topilmadi" });
    }

    await AuditLog.create({
      user: req.user._id,
      action: "UPDATE_TEAM",
      entity: "Team",
      entityId: team._id,
      changes: { updated: team.toJSON() },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"]
    });

    res.status(200).json({ success: true, data: team });
  } catch (error) {
    res.status(500).json({ success: false, message: "Jamoani yangilashda xatolik", error: error.message });
  }
};

// DELETE TEAM (SOFT DELETE)
exports.deleteTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) {
      return res.status(404).json({ success: false, message: "Jamoa topilmadi" });
    }

    team.isActive = false;
    await team.save();

    await AuditLog.create({
      user: req.user._id,
      action: "DELETE_TEAM",
      entity: "Team",
      entityId: team._id,
      changes: { deleted: team.toJSON() },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"]
    });

    res.status(200).json({ success: true, message: "Jamoa o'chirildi" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Jamoani o'chirishda xatolik", error: error.message });
  }
};

// ADD MEMBER
exports.addMemberToTeam = async (req, res) => {
  try {
    const { userId } = req.body;

    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ success: false, message: "Jamoa topilmadi" });

    if (team.members.includes(userId)) {
      return res.status(400).json({ success: false, message: "Bu user allaqachon jamoada bor" });
    }

    team.members.push(userId);
    await team.save();

    await AuditLog.create({
      user: req.user._id,
      action: "ADD_TEAM_MEMBER",
      entity: "Team",
      entityId: team._id,
      changes: { addedMember: userId },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"]
    });

    res.status(200).json({ success: true, data: team });
  } catch (error) {
    res.status(500).json({ success: false, message: "A'zo qo'shishda xatolik", error: error.message });
  }
};

// REMOVE MEMBER
exports.removeMemberFromTeam = async (req, res) => {
  try {
    const { userId } = req.body;

    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ success: false, message: "Jamoa topilmadi" });

    team.members = team.members.filter(m => m.toString() !== userId);
    await team.save();

    await AuditLog.create({
      user: req.user._id,
      action: "REMOVE_TEAM_MEMBER",
      entity: "Team",
      entityId: team._id,
      changes: { removedMember: userId },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"]
    });

    res.status(200).json({ success: true, data: team });
  } catch (error) {
    res.status(500).json({ success: false, message: "A'zoni olib tashlashda xatolik", error: error.message });
  }
};