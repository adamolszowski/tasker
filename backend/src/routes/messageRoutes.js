const express = require("express");
const { requireAuth } = require("../middleware/authMiddleware");
const {
  getProjectMessages,
  createMessage,
  updateMessage,
  deleteMessage,
} = require("../controllers/messageController");

const router = express.Router();

router.get("/api/projects/:projectId/messages", requireAuth, getProjectMessages);
router.post("/api/projects/:projectId/messages", requireAuth, createMessage);
router.patch("/api/messages/:messageId", requireAuth, updateMessage);
router.delete("/api/messages/:messageId", requireAuth, deleteMessage);

module.exports = router;