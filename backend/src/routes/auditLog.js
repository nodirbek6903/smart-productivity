const express = require("express")
const router = express.Router()
const {getAuditLogs} = require("../controllers/adminController")
const {protect} = require("../middlewares/authMiddleware")
const {authorize} = require("../middlewares/roleMiddleware")

router.use(protect)

router.get("/", authorize("ADMIN"), getAuditLogs)

module.exports = router