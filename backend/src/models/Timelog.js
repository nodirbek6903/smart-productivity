const mongoose = require("mongoose")

const timeLogSchema = new mongoose.Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:[true,"Foydalanuvchi majburiy"]
    },
    task:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Task",
        required:[true,"Vazifa majburiy"]
    },
    project:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Project",
        required:[true, "Loyiha majburiy"]
    },
    startTime:{
        type:Date,
        required:[true,"Boshlanish vaqti majburiy"]
    },
    endTime:{
        type:Date
    },
    duration:{
        type:Number,default:0 //daqiqalarda
    },
    description:{
        type:String,
        trim:true
    },
    isBillable:{
        type:Boolean,
        default:true,
    },
    status:{
        type:String,
        enum:["RUNNING","STOPPED","APPROVED","REJECTED"],
        default:"STOPPED"
    },
    approvedBy:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },
    approvedAt:{
        type:Date
    }
},{
    timestamps:true
})

timeLogSchema.index({user:1,startTime:1})
timeLogSchema.index({task:1})
timeLogSchema.index({project:1})

timeLogSchema.pre("save", function(next){
    if(this.startTime && this.endTime){
        const diff = this.endTime - this.startTime
        this.duration = Math.round(diff / (1000 * 60))
    }
    next()
})

module.exports = mongoose.model("TimeLog",timeLogSchema)