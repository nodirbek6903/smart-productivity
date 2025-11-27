const mongoose =require("mongoose")

const teamSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true,
        trim:true
    },
    department:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Department",
        required:true,
    },
    leader:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true,
    },
    members:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    }],
    isActive:{
        type:Boolean,
        default:true
    }
},{timestamps:true})

teamSchema.index({name:1})
teamSchema.index({department:1})

module.exports = mongoose.model("Team",teamSchema)