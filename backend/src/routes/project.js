const express = require("express")
const router = express.Router()
const {addMember,createProject,getAllProjects,getProjectById,updateProject} = require("../controllers/projectController")
const {protect} = require("../middlewares/authMiddleware")
const {authorize} = require("../middlewares/roleMiddleware")
const {validateRequest} = require("../middlewares/validateRequest")

router.use(protect)

router.get("/", getAllProjects)
router.get("/:id",getProjectById)

router.post("/",authorize("ADMIN","MANAGER"),createProject)
router.put("/:id",authorize("ADMIN","MANAGER",updateProject))
router.post("/:id/add-member",authorize("ADMIN","MANAGER"),addMember)

module.exports = router