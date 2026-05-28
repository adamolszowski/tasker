const express = require("express");
const { requireAuth } = require("../middleware/authMiddleware");
const {
  getTaskComments,
  createComment,
  updateComment,
  deleteComment,
} = require("../controllers/commentController");

const router = express.Router();

router.get("/api/tasks/:taskId/comments", requireAuth, getTaskComments);
router.post("/api/tasks/:taskId/comments", requireAuth, createComment);
router.patch("/api/comments/:commentId", requireAuth, updateComment);
router.delete("/api/comments/:commentId", requireAuth, deleteComment);

module.exports = router;
