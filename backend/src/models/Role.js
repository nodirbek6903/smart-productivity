const mongoose = require("mongoose")

const roleSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true,
        unique:true,
        enum:["ADMIN","MANAGER","USER"],
        uppercase:true
    },
    description:String,
    permissions:[{
        type:String,
    }],
    isActive:{
        type:Boolean,
        default:true
    }
},{timestamps:true})

module.exports = mongoose.model("Role", roleSchema)