const Department = require("../models/Department");
const AuditLog = require("../models/AuditLog");

/* =============================
   CREATE DEPARTMENT (ADMIN)
================================ */
exports.createDepartment = async (req, res) => {
  try {
    const { name, description, manager } = req.body;

    const existing = await Department.findOne({ name });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Bu nomdagi bo‘lim allaqachon mavjud",
      });
    }

    const department = await Department.create({
      name,
      description,
      manager,
    });

    await AuditLog.create({
      user: req.user._id,
      action: "CREATE_DEPARTMENT",
      entity: "Department",
      entityId: department._id,
      changes: { created: department.toJSON() },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.status(201).json({ success: true, data: department });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Bo‘lim yaratishda xatolik",
      error: error.message,
    });
  }
};

/* =============================
   GET ALL DEPARTMENTS
   ADMIN → hamma
   MANAGER → faqat o‘z departmenti
================================ */
exports.getAllDepartments = async (req, res) => {
  try {
    const filter = {};

    if (req.user.role.name === "MANAGER") {
      filter._id = req.user.department;
    }

    const departments = await Department.find(filter)
      .populate("manager", "fullName email")
      .populate("members", "fullName email")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: departments });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Bo‘limlar ro‘yxatini olishda xatolik",
      error: error.message,
    });
  }
};

/* =============================
   GET DEPARTMENT BY ID
================================ */
exports.getDepartmentById = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id)
      .populate("manager", "fullName email")
      .populate("members", "fullName email");

    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Bo‘lim topilmadi",
      });
    }

    // RBAC: MANAGER → faqat o‘z departmentini ko‘radi
    if (
      req.user.role.name === "MANAGER" &&
      department._id.toString() !== req.user.department.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Boshqa bo‘lim ma’lumotlarini ko‘ra olmaysiz",
      });
    }

    res.status(200).json({ success: true, data: department });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Bo‘limni olishda xatolik",
      error: error.message,
    });
  }
};

/* =============================
   UPDATE DEPARTMENT
================================ */
exports.updateDepartment = async (req, res) => {
  try {
    const updates = req.body;

    const department = await Department.findById(req.params.id);

    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Bo‘lim topilmadi",
      });
    }

    const oldData = department.toJSON();

    // Admin → hamma  
    // Manager → faqat o‘z departmentini update qiladi  
    const isManager =
      req.user.role.name === "MANAGER" &&
      req.user.department.toString() === department._id.toString();

    if (!isManager && req.user.role.name !== "ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Bo‘limni yangilashga ruxsat yo‘q",
      });
    }

    Object.assign(department, updates);
    await department.save();

    await AuditLog.create({
      user: req.user._id,
      action: "UPDATE_DEPARTMENT",
      entity: "Department",
      entityId: department._id,
      changes: { old: oldData, new: department.toJSON() },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.status(200).json({ success: true, data: department });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Bo‘limni yangilashda xatolik",
      error: error.message,
    });
  }
};

/* =============================
   DELETE DEPARTMENT (SOFT DELETE)
================================ */
exports.deleteDepartment = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);

    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Bo‘lim topilmadi",
      });
    }

    // RBAC: Manager → faqat o‘z departmentini o‘chira oladi
    if (
      req.user.role.name === "MANAGER" &&
      department._id.toString() !== req.user.department.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Boshqa bo‘limni o‘chira olmaysiz",
      });
    }

    const oldData = department.toJSON();

    department.isActive = false;
    await department.save();

    await AuditLog.create({
      user: req.user._id,
      action: "DELETE_DEPARTMENT",
      entity: "Department",
      entityId: department._id,
      changes: { deleted: oldData },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.status(200).json({
      success: true,
      message: "Bo‘lim o‘chirildi",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Bo‘limni o‘chirishda xatolik",
      error: error.message,
    });
  }
};
