const mongoose = require("mongoose")

const departmentSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true,
        unique:true,
        trim:true
    },
    description:{
        type:String,
        trim:true
    },
    manager:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        default:null
    },
    members:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    }],
    isActive:{
        type:Boolean,
        default:true,
    }
},{
    timestamps:true
})
departmentSchema.index({ name: 1 });

module.exports = mongoose.model("Department",departmentSchema)