const express = require("express")
const router = express.Router()
const {changePassword,createUser,deleteUser,getAllUsers,getUserById,getUserStats,updateUser} = require("../controllers/userController")

const {protect} = require("../middlewares/authMiddleware")
const {authorize} = require("../middlewares/roleMiddleware")
const {validateRequest} = require("../middlewares/validateRequest")
const {userValidation} = require("../validations/userValidation")

router.use(protect)

router.get("/stats", authorize("ADMIN"), getUserStats)

router.get("/", authorize("ADMIN","MANAGER"), getAllUsers)

router.get("/:id", authorize("ADMIN","MANAGER","USER"), getUserById)

router.post("/", authorize("ADMIN"),validateRequest(userValidation.create), createUser)

router.put("/:id",validateRequest(userValidation.update), updateUser)

router.put("/:id/change-password", validateRequest(userValidation.changePassword),changePassword)

router.delete("/:id", authorize("ADMIN"), deleteUser)

module.exports = router