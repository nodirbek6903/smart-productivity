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

router.get("/", getAllTasks);

router.get("/:id", getTaskById);

router.post("/", authorize("ADMIN", "MANAGER"), createTask);

router.put("/:id", updateTask);

router.delete("/:id", authorize("ADMIN", "MANAGER"), deleteTask);

router.patch("/:id/status", updateTaskStatus);

router.patch("/:id/add-subtask", addSubtask);
router.patch("/:id/remove-subtask", removeSubtask);

router.patch("/:id/add-dependency", addDependency);
router.patch("/:id/remove-dependency", removeDependency);

router.post("/:id/attachments", upload.single("file"), uploadAttachment);

router.delete("/:id/attachments/:fileId", deleteAttachment);

module.exports = router;
