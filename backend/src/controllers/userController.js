const User = require("../models/User");
const Role = require("../models/Role");
const AuditLog = require("../models/AuditLog");
const validatePasswordStrength = require("../utils/passwordPolicy");

exports.getAllUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      role,
      department,
      isActive,
    } = req.query;

    const filter = {};

    // USER → faqat o'zini ko'radi
    if (req.user.role.name === "USER") {
      filter._id = req.user._id;
    }

    // MANAGER → faqat o'z bo‘limidagi userlarni ko‘radi
    if (req.user.role.name === "MANAGER") {
      filter.department = req.user.department;
    }

    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    if (role) {
      filter.role = role;
    }
    if (department) {
      filter.department = department;
    }
    if (isActive !== undefined) {
      filter.isActive = isActive === "true";
    }

    const skip = (page - 1) * limit;

    const users = await User.find(filter)
      .populate("role", "name description")
      .populate("department", "name")
      .select("-password -refreshToken")
      .limit(parseInt(limit))
      .skip(skip)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        users,
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
      message: "Foydalanuvchilarni olishda xatolik",
      error: error.message,
    });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate("role", "name description permissions")
      .populate("department", "name description manager");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Foydalanuvchi topilmadi",
      });
    }

    // RBAC filtering
    const isSelf = req.user._id.toString() === req.params.id;
    const isAdmin = req.user.role.name === "ADMIN";
    const isManagerSameDept =
      req.user.role.name === "MANAGER" &&
      String(user.department?._id) === String(req.user.department)

    if (!isAdmin && !isSelf && !isManagerSameDept) {
      return res.status(403).json({
        success: false,
        message: "Bu foydalanuvchini ko'rishga ruxsatingiz yo'q",
      });
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Foydalanuvchini olishda xatolik",
      error: error.message,
    });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { email, password, fullName, phone, role, department, position } = req.body;

    // 1️⃣ Email unique bo'lishi shart
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Bu email allaqachon ro'yxatdan o'tgan",
      });
    }

    // 2️⃣ Rol mavjudligini tekshiramiz
    const userRole = await Role.findById(role);
    if (!userRole) {
      return res.status(400).json({
        success: false,
        message: "Berilgan rol ID topilmadi",
      });
    }

    // 3️⃣ RBAC Qoidalari
    const isAdmin = req.user.role.name === "ADMIN";
    const isManager = req.user.role.name === "MANAGER";

    // ⭐ MANAGER uchun cheklovlar
    if (isManager) {
      
      // Manager faqat USER yaratadi
      if (userRole.name !== "USER") {
        return res.status(403).json({
          success: false,
          message: "Manager faqat USER rolidagi xodim yaratishi mumkin",
        });
      }

      // Manager faqat o‘z departmentiga user yaratadi
      if (String(department) !== String(req.user.department)) {
        return res.status(403).json({
          success: false,
          message: "Manager faqat o'z bo'limi uchun foydalanuvchi yaratishi mumkin",
        });
      }
    }

    // 4️⃣ Userni yaratish
    const user = await User.create({
      email,
      password,
      fullName,
      phone,
      role,
      department,
      position,
      isEmailVerified: true,
    });

    // 5️⃣ Audit log
    await AuditLog.create({
      user: req.user._id,
      action: "CREATE_USER",
      entity: "User",
      entityId: user._id,
      changes: { created: user.toJSON() },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    return res.status(201).json({
      success: true,
      message: "Foydalanuvchi muvaffaqqiyatli yaratildi",
      data: user,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Foydalanuvchi yaratishda xatolik",
      error: error.message,
    });
  }
};


exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    const isAdmin = req.user && req.user.role && req.user.role.name === "ADMIN";
    const isSelf = req.user && req.user._id && req.user._id.toString() === id;

    if (!isAdmin && !isSelf) {
      return res.status(403).json({
        success: false,
        message: "Sizda bu amalni bajarish huquqi yo'q",
      });
    }

    delete updates.password;
    delete updates.refreshToken;

    if (!isAdmin) {
      delete updates.role;
      delete updates.isActive;
      delete updates.department;
    }

    const oldUser = await User.findById(id);

    if (!oldUser) {
      return res.status(404).json({
        success: false,
        message: "Foydalanuvchi topilmadi",
      });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate("role", "name description");

    await AuditLog.create({
      user: req.user._id,
      action: "UPDATE_USER",
      entity: "User",
      entityId: user._id,
      changes: { old: oldUser.toJSON(), new: user.toJSON() },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.status(200).json({
      success: true,
      message: "Foydalanuvchi muvaffaqqiyatli yangilandi",
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Foydalanuvchini yangilashda xatolik",
      error: error.message,
    });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Foydalanuvchi topilmadi",
      });
    }

    user.isActive = false;
    await user.save();

    await AuditLog.create({
      user: req.user._id,
      action: "DELETE_USER",
      entity: "User",
      entityId: user._id,
      changes: { deleted: user.toJSON() },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.status(200).json({
      success: true,
      message: "Foydalanuvchi muvaffaqqiyatli o'chirildi",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Foydalanuvchini o'chirishda xatolik",
      error: error.message,
    });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    const { valid, errors } = validatePasswordStrength(newPassword);
    if (!valid) {
      return res.status(400).json({
        success: false,
        message: "Yangi parol kuchsiz",
        errors,
      });
    }

    const isAdmin = req.user && req.user.role && req.user.role.name === "ADMIN";
    const isSelf = req.user && req.user._id && req.user._id.toString() === id;

    if (!isAdmin && !isSelf) {
      return res.status(403).json({
        success: false,
        message: "Sizda bu amalni bajarish huquqi yo'q",
      });
    }

    const user = await User.findById(id).select("+password");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Foydalanuvchi topilmadi",
      });
    }
    if (isSelf) {
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: "Joriy parol noto'g'ri",
        });
      }
    }
    user.password = newPassword;
    await user.save();

    await AuditLog.create({
      user: req.user._id,
      action: "CHANGE_PASSWORD",
      entity: "User",
      entityId: user._id,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.status(200).json({
      success: true,
      message: "Parol muvaffaqqiyatli o'zgartirildi",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Parolni o'zgartirishda xatolik",
      error: error.message,
    });
  }
};

exports.getUserStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const inactiveUsers = await User.countDocuments({ isActive: false });

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

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        inactiveUsers,
        usersByRole,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Statistikani olishda xatolik",
      error: error.message,
    });
  }
};
