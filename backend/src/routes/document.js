const express = require("express")
const router = express.Router()
const {deleteDocument,getAllDocuments,getDocumentById,updateDocument,uploadDocument} = require("../controllers/documentController")
const {protect} = require("../middlewares/authMiddleware")
const {authorize} = require("../middlewares/roleMiddleware")
const upload = require("../middlewares/taskUpload")

router.use(protect)

router.post("/",upload.single("file"),uploadDocument)
router.get("/",getAllDocuments)
router.get("/:id",getDocumentById)
router.put("/:id",updateDocument)
router.delete("/:id",deleteDocument)







module.exports = router
