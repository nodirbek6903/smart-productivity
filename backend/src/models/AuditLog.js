const mongoose = require("mongoose")

const auditLogSchema = new mongoose.Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    action:{
        type:String,
        required:true
        // Masalan: 'CREATE_USER', 'UPDATE_PROJECT', 'DELETE_TASK'
    },
    entity:{
        type:String,
        required:true
        // masalan: "User", "Project", "Task"
    },
    entityId:{
        type: mongoose.Schema.Types.ObjectId,
        required:true
    },
    changes:{
        type:mongoose.Schema.Types.Mixed
        // old va yangi qiymatlar
    },
    ipAddress:{
        type:String,
    },
    userAgent:{
        type:String
    },
    timestamp:{
        type:Date,
        default:Date.now
    }
},{timestamps:true})

auditLogSchema.index({user:1,timestamp: -1})
auditLogSchema.index({entity:1, entityId:1})
auditLogSchema.index({timestamp:-1})

module.exports = mongoose.model("AuditLog", auditLogSchema)