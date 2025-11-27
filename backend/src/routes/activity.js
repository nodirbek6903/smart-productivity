const express = require("express");
const router = express.Router();
const {
  getAllActivity,
  getUserActivity,
  getMyActivity
} = require("../controllers/activityController");

const { protect } = require("../middlewares/authMiddleware");
const { authorize } = require("../middlewares/roleMiddleware");

// Faqat login bo‘lgan user o‘z loglarini ko‘ra oladi
router.get("/me", protect, getMyActivity);

// Admin — barcha loglarni ko‘ra oladi
router.get("/", protect, authorize("ADMIN"), getAllActivity);

// Admin yoki Manager — user activity ko‘ra oladi
router.get("/user/:id", protect, authorize("ADMIN", "MANAGER"), getUserActivity);

module.exports = router;
