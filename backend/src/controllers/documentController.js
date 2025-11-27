const Document = require("../models/Document")
const AuditLog = require("../models/AuditLog")
const fileService = require("../services/fileService")

exports.uploadDocument = async (req,res) => {
    try {
        const {project,task,category,tags} = req.body

        const userId = req.user._id
        const file = req.file

        if(!file){
            return res.status(400).json({
                success:false,message:"Fayl tanlanmagan"
            })
        }

        const uploaded = await fileService.uploadFile(file)

        const document = await Document.create({
            filename:uploaded.filename,
            originalName:uploaded.originalName || file.originalName,
            path:uploaded.path,
            size:uploaded.size,
            mimetype:uploaded.mimetype,
            uploadedBy:userId,
            project,
            task,
            category,
            tags: tags ? tags.split(",").map((t) => t.trim()) : [],
            version:1
        })

        await AuditLog.create({
            user:userId,
            action:"UPLOAD_DOCUMENT",
            entity:"Document",
            entityId:document._id,
            changes:{filename:document.filename, size:document.size},            
        })

        res.status(201).json({
            success:true,
            message:"Fayl muvaffaqqiyatli yuklandi",
            data:document
        })
    } catch (error) {
        res.status(500).json({
      success: false,
      message: 'Document yuklashda xatolik',
      error: error.message
    });
    }
}

exports.getAllDocuments = async (req,res) => {
        try {
            const documents = await Document.find()
            .populate("uploadedBy", "fullName email")
            .populate("project", "name")
            .populate("task","title")
            .sort({createdAt: -1})

            res.status(200).json({success:true,data:documents})
        } catch (error) {
            res.status(500).json({success:false,message:"Documentlarni olishda xatolik",error:error.message})
        }
}

exports.getDocumentById = async (req,res) => {
    try {
        const document = await Document.findById(req.params.id)
        .populate("uploadedBy","fullName email")
        .populate("project","name")
        .populate("task","title")

        if(!document){
            return res.status(404).json({success:false,message:"Hujjat topilmadi"})
        }

        res.status(200).json({success:true,data:document})
    } catch (error) {
        res.status(500).json({success:false,message:'Document olishda xatolik',error:error.message})
    }
}

exports.updateDocument = async (req,res) => {
    try {
        const {title,tags} = req.body
        const file = req.file

        const oldDoc = await Document.findById(req.params.id)
        if(!oldDoc){
            return res.status(404).json({success:false,message:"Hujjat topilmadi"})
        }

        let newDocData = {
            filename:oldDoc.filename,
            originalName:oldDoc.originalName,
            path:oldDoc.path,
            size:oldDoc.size,
            mimetype:oldDoc.mimetype,
            uploadedBy:req.user._id,
            project:oldDoc.project,
            task:oldDoc.task,
            category:oldDoc.category,
            tags:tags ? tags.split(",").map((t) => t.trim()) : oldDoc.tags,
            previousVersion: oldDoc._id,
            version: oldDoc.version + 1
        }

        if(file){
            const uploaded = await fileService.uploadFile(file)

            newDocData = {
                ...newDocData,
                filename:uploaded.filename,
                originalName:uploaded.originalName || file.originalName,
                path:uploaded.path,
                size:uploaded.size,
                mimetype:uploaded.mimetype
            }
        }

        const newDoc = await Document.create(newDocData)

        oldDoc.isActive = false
        await oldDoc.save()

        await AuditLog.create({
            user:req.user._id,
            action:"UPDATE_DOCUMENT",
            entity:"Document",
            entityId:newDoc._id,
            changes:{version:newDoc.version}
        })

        res.status(200).json({success:true,message:"Hujjat yangilandi",document:newDoc})
    } catch (error) {
        res.status(500).json({success:false,message:"Yangilashda xatolik",error:error.message})
    }
}

exports.deleteDocument = async (req,res) => {
    try {
        const document = await Document.findById(req.params.id)
        if(!document){
            return res.status(404).json({success:false,message:"Hujjat topilmadi"})
        }
        await Document.findByIdAndDelete(req.params.id)

        await AuditLog.create({
            user:req.user._id,
            action:"DELETE_DOCUMENT",
            entity:"Document",
            entityId:document._id,
            changes:{filename:document.filename}
        })

        res.status(200).json({success:true,message:"Hujjat o'chirildi"})
    } catch (error) {
        res.status(500).json({success:false,message:"O'chirishda xatolik",error:error.message})
    }
}