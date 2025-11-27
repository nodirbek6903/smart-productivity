const fs = require("fs")
const path = require("path")
const UPLOAD_DIR = path.join(__dirname,"../../uploads")

if(!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, {recursive:true});

exports.saveFile = async (file) => {
  // file: multer file object
  const dest = path.join(UPLOAD_DIR, file.originalname);
  // if file.path exists already (multer local), move or return path
  return {
    filename: file.filename || file.originalname,
    originalName: file.originalname,
    path: file.path || dest,
    size: file.size,
    mimetype: file.mimetype
  };
};