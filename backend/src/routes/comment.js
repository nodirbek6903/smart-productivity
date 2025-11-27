const express = require("express")
const router = express.Router()
const {createComment} = require("../controllers/commentController")
const {protect} = require("../middlewares/authMiddleware")
const {authorize} = require("../middlewares/roleMiddleware")

router.use(protect)

router.post("/add-comment", createComment)

module.exports = router