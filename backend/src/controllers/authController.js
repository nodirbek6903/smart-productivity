const asyncHandler = require("express-async-handler")
const User = require("../models/User")
const Role = require("../models/Role")
const AuditLog = require("../models/AuditLog")
const generateToken = require("../utils/generateToken")
const validatePasswordStrength = require("../utils/passwordPolicy");



exports.register = asyncHandler(async (req,res) => {
  const {fullName,email,password,roleName} = req.body

  const { valid, errors } = validatePasswordStrength(password);
  if (!valid) {
    return res.status(400).json({ message: "Parol juda kuchsiz", details: errors });
  }

  const existingUser  = await User.findOne({email})

  if(existingUser){
    return res.status(400).json({
      success: false,
      message: "Bu email allaqachon ro'yxatdan o'tgan",
    });
  }

  const role = (await Role.findOne({name:roleName})) || (await Role.findOne({name:"USER"}))
  if(!role){
    return res.status(400).json({
      success: false,
      message: "Ko'rsatilgan rol topilmadi",
    });
  }

  const user = await User.create({
    fullName,email,
    password,
    role:role._id,
    isEmailVerified:true
  })

  await AuditLog.create({
    user:user._id,
    action:"REGISTER",
    entity:"User",
    entityId:user._id,
    changes:{created:user.toJSON()},
    ipAddress:req.ip,
    userAgent:req.headers["user-agent"]
  })

  res.status(201).json({
    success:true,
    message:"Foydalanuvchi muvaffaqqiyatli ro'yxatdan o'tdi",
    data:{
      _id:user._id,
      fullName:user.fullName,
      email:user.email,
      role:role.name,
      token:generateToken(user._id)
    }
  })
})

exports.login = asyncHandler(async (req,res) => {
  const {email,password} = req.body

  const user = await User.findOne({email}).populate("role","name description")
  if(!user){
    return res.status(401).json({
      success:false,
      message:"Email yoki parol noto'g'ri"
    })
  }

  const isMatch = await User.comparePassword(password)
  if(!isMatch){
    return res.status(401).json({
      success: false,
      message: "Email yoki parol noto'g'ri",
    });
  }

  const token = generateToken(user._id)

  await AuditLog.create({
    user:user._id,
    action:"LOGIN",
    entity:"User",
    entityId:user._id,
    ipAddress:req.ip,
    userAgent:req.headers["user-agent"]
  })

  res.status(200).json({
    success:true,
    message:"Tizimga muvaffaqqiyatli kirildi",
    data:{
      _id:user._id,
      fullName:user.fullName,
      email:user.email,
      role:user?.role?.name,
      token
    }
  })
})

exports.logout = asyncHandler(async (req,res) => {
   await AuditLog.create({
    user:req.user._id,
    action:"LOGOUT",
    entity: "User",
    entityId: req.user._id,
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
   })

   res.status(200).json({
    success:true,
    message:"Foydalanuvchi tizimdan chiqdi"
   })
})

exports.getMe = asyncHandler(async (req,res) => {
  const user = await User.findById(req.user._id).populate("role","name description permissions").select("-password")

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "Foydalanuvchi topilmadi",
    });
  }

  res.status(200).json({
    success: true,
    data: user,
  });
})

exports.updateMe = asyncHandler(async (req,res) => {
  const updates = req.body

  delete updates.role;
  delete updates.isActive;
  delete updates.password;
  delete updates.email;

  const oldUser = await User.findById(req.user._id)

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {$set:updates},
    {new:true,runValidators:true}
  ).select("-password")

  await AuditLog.create({
    user:req.user._id,
    action:"UPDATE_PROFILE",
    entity:"User",
    entityId:user._id,
    changes:{old:oldUser.toJSON(),new:user.toJSON()},
    ipAddress:req.ip,
    userAgent:req.headers["user-agent"]
  })

  res.status(200).json({
    success:true,
    message:"Profil muvaffaqqiyatli yangilandi",
    data:user
  })
})

exports.updateAvatar = asyncHandler(async (req,res) => {
  if(!req.file){
    return res.status(200).json({success:false,message:"Rasm fayli topilmadi"})
  }

  const oldUser = await User.findById(req.user._id)

  const user = await User.findByIdAndUpdate(req.user._id, {avatar: `/uploads/avatars/${req.file.filename}`},{new:true})
  
  await AuditLog.create({
    user:req.user._id,
    action:"UPDATE_AVATAR",
    entity:"User",
    entityId:user._id,
    changes:{old:oldUser.toJSON(),new:user.toJSON()},
    ipAddress:req.ip,
    userAgent:req.headers["user-agent"]
  })

  res.status(200).json({success:true,message:"Avatar muvaffaqqiyatli o'zgartirildi",data:user})
})