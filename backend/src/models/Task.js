const mongoose = require("mongoose")

const taskSchema = new mongoose.Schema({
    title:{
        type:String,
        required:[true,"Vazifa nomi majburiy"],
        trim:true
    },
    description:{
        type:String,
        trim:true
    },
    project:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Project",
        required:[true,"Loyiha majburiy"]
    },
    assignedTo:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:[true, "Mas'ul shaxs majburiy"]
    },
    createdBy:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    status:{
        type:String,
        enum:["TODO","IN_PROGRESS","REVIEW","TESTING","DONE","CANCELLED"],
        default:"TODO"
    },
    priority:{
        type:String,
        enum:["LOW","MEDIUM","HIGH","CRITICAL"],
        default:"MEDIUM"
    },
    dueDate:{
        type:Date
    },
    estimatedHours:{
        type:Number,
        default:0
    },
    actualHours:{
        type:Number,
        default:0
    },
    parentTask:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Task",
        default:null
    },
    dependencies:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Task"
    }],
    tags:[{
        type:String,
        trim:true
    }],
    attachments:[{
        filename:String,
        path:String,
        size:Number,
        mimetype:String,
        uploadedAt:{type:Date,default:Date.now}
    }],
    completedAt:{
        type:Date,
        default:null,
    },
    isActive:{
        type:Boolean,default:true
    }
},{timestamps:true})

taskSchema.index({project:1})
taskSchema.index({assignedTo:1})
taskSchema.index({status:1})
taskSchema.index({priority:1})
taskSchema.index({dueDate:1})

taskSchema.pre("save", function(next){
    if(this.isModified("status") && this.status ==="DONE" && !this.completedAt){
        this.completedAt = new Date()
    }
    next()
})

module.exports = mongoose.model("Task",taskSchema)