const express = require("express")
const router = express.Router()
const {createDepartment,deleteDepartment,getAllDepartments,getDepartmentById,updateDepartment} = require("../controllers/departmentController")
const {protect} = require("../middlewares/authMiddleware")
const {authorize} = require("../middlewares/roleMiddleware")

router.post("/",protect,authorize("ADMIN"),createDepartment)
router.get("/",protect,authorize("ADMIN","MANAGER"), getAllDepartments)
router.get("/:id",protect,authorize("ADMIN","MANAGER","USER"),getDepartmentById)
router.put("/:id",protect,authorize("ADMIN"),updateDepartment)
router.delete("/:id",protect,authorize("ADMIN"),deleteDepartment)

module.exports = router