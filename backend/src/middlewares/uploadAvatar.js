const multer = require("multer")
const path = require("path")

const storage = multer.diskStorage({
    destination: (req,file,cb) => {
        cb(null,"upload/avatars")
    },
    filename:(req,file,cb) => {
        cb(null, "avatar_" + req.user._id + path.extname(file.originalname))
    }
})

const fileFilter = (req,file,cb) => {
    if(file.mimetype.startsWith("image/")) cb(null,true);
    else cb(new Error("Faqat rasm yuklash mumkin"),false)
}

module.exports = multer({storage,fileFilter})