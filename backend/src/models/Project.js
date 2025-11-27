const mongoose = require("mongoose")

const projectSchema = new mongoose.Schema({
    name:{
        type:String,
        required:[true,"Loyiha nomi majburiy"],
        trim:true,
    },
    description:{
        type:String,
        trim:true
    },
    code:{
        type:String,
        unique:true,
        trim:true,
        uppercase:true,
    },
    manager:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:[true,"Loyiha menejeri majburiy"]
    },
    department:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Department"
    },
    members:[{
        user:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"User"
        },
        role:{
            type:String,
            enum:["LEAD","MEMBER","VIEWER"],
            default:"MEMBER"
        },
        addedAt:{
            type:Date,
            default:Date.now
        }
    }],
    status:{
        type:String,
        enum:["PLANNING","ACTIVE","ON_HOLD","COMPLETED","CANCELLED"],
        default:"PLANNING"
    },
    priority:{
        type:String,
        enum:["LOW","MEDIUM","HIGH","CRITICAL"],
        default:"MEDIUM"
    },
    startDate:{
        type:Date,
        required:[true,"Boshlanish sanasi majburiy"]
    },
    endDate:{
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
    budget:{
        allocated:{type:Number,default:0},
        spent:{type:Number,default:0}
    },
    tags:[{type:String,trim:true}],
    isActive:{
        type:Boolean,
        default:true
    }
},{timestamps:true})

projectSchema.index({name:1})
projectSchema.index({code:1})
projectSchema.index({manager:1})
projectSchema.index({status:1})
projectSchema.index({startDate:1,endDate:1})

projectSchema.virtual("taskCount", {
    ref:"Task",
    localField:"_id",
    foreignField:"project",
    count:true
})

module.exports = mongoose.model("Project",projectSchema)