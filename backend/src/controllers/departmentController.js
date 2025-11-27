const Department = require("../models/Department");
const AuditLog = require("../models/AuditLog");

exports.createDepartment = async (req, res) => {
  try {
    const { name, description, manager } = req.body;

    const existing = await Department.findOne({ name });
    if (existing) {
      return res
        .status(400)
        .json({ success: false, message: "Bu bo'limda allaqachon mavjud" });
    }

    const department = await Department.create({ name, description, manager });

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
      message: "Bo'lim yaratishda xatolik",
      error: error.message,
    });
  }
};

exports.getAllDepartments = async (req, res) => {
  try {
    const departments = await Department.find()
      .populate("manager", "fullName email")
      .populate("members", "fullName email")
      .sort({ createdAt: -1 });

      res.status(200).json({success:true,data:departments})
  } catch (error) {
    res.status(500).json({ success: false, message: "Bo'limlarni olishda xatolik", error: error.message });
  }
};

exports.getDepartmentById = async (req,res) => {
    try {
        const department = await Department.findById(req.params.id)
        .populate("manager","fullName email").populate("members","fullName email")

        if(!department){
            return res.status(404).json({success:false,message:"Bo'lim topilmadi"})
        }

        res.status(200).json({success:true,data:department})
    } catch (error) {
        res.status(500).json({ success: false, message: "Bo'limni olishda xatolik", error: error.message });
    }
}

exports.updateDepartment = async (req,res) => {
    try {
        const updates = req.body
        const department = await Department.findByIdAndUpdate(req.params.id, updates, {new:true,runValidators:true})

        if(!department){
            return res.status(404).json({ success: false, message: "Bo'lim topilmadi" });
        }

        await AuditLog.create({
            user:req.user._id,
            action:"UPDATE_DEPARTMENT",
            entity:"Department",
            entityId:department._id,
            changes:{updated:department.toJSON()},
            ipAddress:req.ip,
            userAgent:req.headers["user-agent"]
        })

        res.status(200).json({success:true,data:department})
    } catch (error) {
        res.status(500).json({ success: false, message: "Bo'limni yangilashda xatolik", error: error.message });
    }
}

exports.deleteDepartment = async (req,res) => {
    try {
        const department = await Department.findById(req.params.id)
        if (!department) {
      return res.status(404).json({ success: false, message: "Bo'lim topilmadi" });
    }
    department.isActive = false
    await department.save()

    await AuditLog.create({
        user:req.user._id,
        action:"DELETE_DEPARTMENT",
        entity:"Department",
        entityId:department._id,
        changes:{deleted:department.toJSON()},
        ipAddress:req.ip,
        userAgent:req.headers["user-agent"]
    })

    res.status(200).json({success:true,message:"Bo'lim muvaffaqqiyatli o'chirildi"})
    } catch (error) {
        res.status(500).json({ success: false, message: "Bo'limni o'chirishda xatolik", error: error.message });
    }
}
