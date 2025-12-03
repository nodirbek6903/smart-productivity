const express = require("express")
const router = express.Router()
const {cleanupExports,exportProductivityReport,exportProjects,exportTasks,exportTimeLogs,exportUsers} = require("../controllers/exportController")
const {protect} = require("../middlewares/authMiddleware")
const {checkPermission} = require("../middlewares/permissionMiddleware")

router.use(protect)

router.get("/tasks", checkPermission("task:read"), exportTasks)

router.get("/projects", checkPermission("project:read"), exportProjects)

router.get("/timelogs", checkPermission("time:view-own"), exportTimeLogs)

router.get("/users", checkPermission("user:read"), exportUsers)

router.get("/productivity", checkPermission("report:view-all"), exportProductivityReport)

router.delete("/cleanup", checkPermission("system:manage-settings"), cleanupExports)

module.exports = router