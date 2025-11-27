const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const Role = require("../models/Role");

// @desc  Tokenni tekshirish va foydalanuvchini yuklash
exports.protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await User.findById(decoded.id)
        .populate("role", "name description permissions")
        .select("-password");

      if (!req.user) {
        return res.status(401).json({ success: false, message: "Foydalanuvchi topilmadi" });
      }

      next();
    } catch (error) {
      return res.status(401).json({ success: false, message: "Token yaroqsiz yoki muddati tugagan" });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: "Token mavjud emas" });
  }
});
