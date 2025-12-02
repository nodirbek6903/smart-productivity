const express = require('express');
const router = express.Router();
const {protect} = require("../middlewares/authMiddleware")
const {getMyNotifications,markAllAsRead,markAsRead} = require("../controllers/notificationController")

router.use(protect)

router.get("/",getMyNotifications)
router.post("/:id/read", markAsRead)
router.put("/mark-all-read", markAllAsRead)

module.exports = router