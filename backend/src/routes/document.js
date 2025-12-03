const express = require("express")
const router = express.Router()
const {deleteDocument,getAllDocuments,getDocumentById,updateDocument,uploadDocument} = require("../controllers/documentController")
const {protect} = require("../middlewares/authMiddleware")
const {authorize} = require("../middlewares/roleMiddleware")
const upload = require("../middlewares/taskUpload")

router.use(protect)

router.post("/", authorize("ADMIN","MANAGER"), upload.single("file"), uploadDocument)
router.get("/", authorize("ADMIN","MANAGER","USER"), getAllDocuments)
router.get("/:id", authorize("ADMIN","MANAGER","USER"), getDocumentById)
router.put("/:id", authorize("ADMIN","MANAGER"), updateDocument)
router.delete("/:id", authorize("ADMIN"), deleteDocument)

module.exports = router
