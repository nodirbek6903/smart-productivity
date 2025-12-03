const express = require("express");
const router = express.Router();

const {
  createTask,
  getAllTasks,
  updateTaskStatus,
  addDependency,
  addSubtask,
  deleteAttachment,
  deleteTask,
  getTaskById,
  removeDependency,
  removeSubtask,
  updateTask,
  uploadAttachment,
} = require("../controllers/taskController");
const { protect } = require("../middlewares/authMiddleware");
const { authorize } = require("../middlewares/roleMiddleware");
const upload = require("../middlewares/taskUpload");

router.use(protect);

router.get("/",authorize("ADMIN"), getAllTasks);

router.get("/:id",authorize("ADMIN","MANAGER","USER"), getTaskById);

router.post("/", authorize("ADMIN", "MANAGER"), createTask);

router.put("/:id",authorize("ADMIN","MANAGER"), updateTask);

router.delete("/:id", authorize("ADMIN", "MANAGER"), deleteTask);

router.patch("/:id/status",authorize("ADMIN","MANAGER","USER"), updateTaskStatus);

router.patch("/:id/add-subtask",authorize("ADMIN","MANAGER"), addSubtask);
router.patch("/:id/remove-subtask",authorize("ADMIN","MANAGER"), removeSubtask);

router.patch("/:id/add-dependency",authorize("ADMIN","MANAGER"), addDependency);
router.patch("/:id/remove-dependency",authorize("ADMIN","MANAGER"), removeDependency);

router.post("/:id/attachments", authorize("ADMIN","MANAGER","USER"), upload.single("file"), uploadAttachment);

router.delete("/:id/attachments/:fileId",authorize("ADMIN","MANAGER","USER"), deleteAttachment);

module.exports = router;
