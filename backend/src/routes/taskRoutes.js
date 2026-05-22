const express = require("express");
const { requireAuth } = require("../middleware/authMiddleware");
const {
  getTaskStatuses,
  getTaskPriorities,
  getTasks,
  getProjectTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  changeTaskStatus,
  getAssignableUsers,
} = require("../controllers/taskController");

const router = express.Router();

router.get("/api/task-statuses", requireAuth, getTaskStatuses);
router.get("/api/task-priorities", requireAuth, getTaskPriorities);
router.get("/api/tasks", requireAuth, getTasks);
router.get("/api/projects/:projectId/tasks", requireAuth, getProjectTasks);
router.get("/api/projects/:projectId/task-assignable-users", requireAuth, getAssignableUsers);
router.get("/api/tasks/:id", requireAuth, getTaskById);
router.post("/api/tasks", requireAuth, createTask);
router.patch("/api/tasks/:id", requireAuth, updateTask);
router.delete("/api/tasks/:id", requireAuth, deleteTask);
router.patch("/api/tasks/:id/status", requireAuth, changeTaskStatus);

module.exports = router;