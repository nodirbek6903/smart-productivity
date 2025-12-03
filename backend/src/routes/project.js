const express = require("express")
const router = express.Router()
const {addMember,createProject,getAllProjects,getProjectById,updateProject,removeMember} = require("../controllers/projectController")
const {protect} = require("../middlewares/authMiddleware")
const {authorize} = require("../middlewares/roleMiddleware")

router.use(protect)

router.get("/",authorize("ADMIN"), getAllProjects)
router.get("/:id",authorize("ADMIN","MANAGER","USER"), getProjectById)

router.post("/",authorize("ADMIN","MANAGER"),createProject)
router.put("/:id", authorize("ADMIN","MANAGER"), updateProject);
router.patch("/:id/add-member",authorize("ADMIN","MANAGER"),addMember)
router.patch("/:id/remove-member", authorize("ADMIN","MANAGER"), removeMember)
module.exports = router