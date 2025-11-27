const express = require("express");
const router = express.Router();
const { register, login,getMe,logout,updateAvatar,updateMe } = require("../controllers/authController");
const {protect} = require("../middlewares/authMiddleware")
const uploadAvatar = require("../middlewares/uploadAvatar")

router.post("/register", register);
router.post("/login", login);

router.post("/logout", protect, logout)

router.get("/me", protect, getMe)

router.put("/me", protect, updateMe)
router.put("/me/avatar",protect, uploadAvatar.single("avatar"), updateAvatar)

module.exports = router;
