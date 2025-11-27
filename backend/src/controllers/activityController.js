const AuditLog = require("../models/AuditLog")
const User = require("../models/User")


exports.getAllActivity = async(req,res) => {
    try {
        const {user,action,entity,startDate,endDate} = req.query

        let filter = {}

        if(user){
            filter.user= user
        }
        if(action){
            filter.action = action
        }
        if(entity){
            filter.entity = entity
        }
        if(startDate || endDate){
            filter.timestamp = {}
            if(startDate){
                filter.timestamp.$gte = new Date(startDate)
            }
            if(endDate){
                filter.timestamp.$lte = new Date(endDate)
            }
        }

        const logs = await AuditLog.find(filter).populate("user","fullName email role").sort({timestamp:-1})

        res.status(200).json({success:true,data:logs})
    } catch (error) {
        res.status(500).json({
      success: false,
      message: "Activity loglarni olishda xatolik",
      error: error.message,
    });
    }
}

exports.getUserActivity = async (req,res) => {
    try {
        const userId = req.params.id

        const exists = await User.findById(userId)
        if(!exists){
            return res.status(404).json({success:false,message:"Foydalanuvchi topilmadi"})
        }

        const logs = await AuditLog.find({user:userId}).sort({timestamp:-1}).limit(200)

        res.status(200).json({success:true,data:logs})
    } catch (error) {
        res.status(500).json({
      success: false,
      message: "Foydalanuvchi activity loglarini olishda xatolik",
      error: error.message,
    });
    }
}

exports.getMyActivity = async (req,res) => {
    try {
        const logs = await AuditLog.find({user:req.user._id}).sort({timestamp:-1}).limit(200)

        res.status(200).json({success:true,data:logs})
    } catch (error) {
        res.status(500).json({
      success: false,
      message: "Activity tarixini olishda xatolik",
      error: error.message,
    });
    }
}