const express = require("express")
const router = express.Router()
const {getAdminDashboard,getManagerDashboard,getMyTasks,getTaskStatistics,getTeamAnalytics,getUserDashboard} = require("../controllers/dashboardController")
const {protect} = require("../middlewares/authMiddleware")
const {authorize} = require("../middlewares/roleMiddleware")

router.use(protect)

router.get("/admin", authorize("ADMIN"), getAdminDashboard)

router.get("/manager", authorize("MANAGER"), getManagerDashboard)
router.get("/manager/team-analytics", authorize("MANAGER"), getTeamAnalytics)


router.get("/user", authorize("USER"), getUserDashboard)
router.get("/user/my-tasks", authorize("USER"), getMyTasks)
router.get("/user/tasks-statistics", authorize("USER"), getTaskStatistics)


module.exports = router