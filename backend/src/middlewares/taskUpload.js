const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const taskId = req.params.id;

    const uploadPath = `uploads/tasks/${taskId}`;
    fs.mkdirSync(uploadPath, { recursive: true });

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = uuidv4() + path.extname(file.originalname);
    cb(null, uniqueName);
  },
});

const allowedTypes = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "application/pdf",
  "application/zip",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // docx
  "application/msword",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // xlsx
  "text/plain",
];

const fileFilter = (req,file,cb) => {
    if(allowedTypes.includes(file.mimetype)){
        cb(null,true)
    }
    else{
        cb(new Error("Yuklash uchun fayl formati ruxsat berilmagan"),false)
    }
}

module.exports = multer({storage,fileFilter})
