const mongoose = require("mongoose")

const notificationSchema = new mongoose.Schema({
    recipient:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    sender:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },
    type:{
        type:String,
        enum:["TASK_ASSIGNED","TASK_UPDATED","TASK_COMPLETED","COMMENT","MENTION","PROJECT_UPDATE","SYSTEM"],
        required:true,
    },
    title:{
        type:String,required:true,
        trim:true
    },
    message:{
        type:String,required:true,
        trim:true
    },
    relatedEntity:{
        entityType:{
            type:String,
            enum:["Task","Project","User","Comment"]
        },
        entityId:{
            type:mongoose.Schema.Types.ObjectId
        }
    },
    isRead:{
        type:Boolean,
        default:false
    },
    readAt:{
        type:Date
    },
    priority:{
        type:String,
        enum:["LOW","NORMAL","HIGH"],
        default:"NORMAL"
    }
},{timestamps:true})


notificationSchema.index({recipient:1,isRea:1,createdAt:-1})

module.exports = mongoose.model("Notification",notificationSchema)