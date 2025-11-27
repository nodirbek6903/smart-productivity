const express = require("express")
const router =express.Router()
const {addMemberToTeam,createTeam,deleteTeam,getAllTeams,getTeamById,removeMemberFromTeam,updateTeam} = require("../controllers/teamController")
const  {protect} = require("../middlewares/authMiddleware")
const  {authorize} = require("../middlewares/roleMiddleware")

router.use(protect)

router.post("/",authorize("ADMIN"),createTeam)
router.put("/:id",authorize("ADMIN"), updateTeam)
router.delete("/:id",authorize("ADMIN"),deleteTeam)

router.get("/", getAllTeams)
router.get("/:id",getTeamById)

router.post("/:id/add-member", authorize("ADMIN","MANAGER"), addMemberToTeam)
router.post("/:id/remove-member", authorize("ADMIN","MANAGER"),removeMemberFromTeam)

module.exports = router