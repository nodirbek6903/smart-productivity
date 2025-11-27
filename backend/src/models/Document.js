const mongoose = require("mongoose")

const documentSchema = new mongoose.Schema({
    filename:{
        type:String,
        required:[true,"Fayl nomi majburiy"]
    },
    originalName:{
        type:String,
        required:true
    },
    path:{
        type:String,
        requierd:true
    },
    size:{
        type:Number,
        required:true,
    },
    mimetype:{
        type:String,
        required:true
    },
    uploadedBy:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    project:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Project"
    },
    task:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Task"
    },
    category:{
        type:String,
        enum:["DOCUMENT","IMAGE","VIDEO","AUDIO","OTHER"],
        default:"DOCUMENT"
    },
    tags:[{
        type:String,
        trim:true
    }],
    version:{
        type:Number,
        default:1
    },
    previousVersion:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Document"
    },
    isActive:{
        type:Boolean,
        default:true
    }
},{timestamps:true})

documentSchema.index({uploadedBy:1})
documentSchema.index({project:1})
documentSchema.index({task:1})

module.exports = mongoose.model("Document",documentSchema)