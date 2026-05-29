const express = require("express");
const { requireAuth } = require("../middleware/authMiddleware");
const {
  getNotifications,
  getUnreadNotificationsCount,
  getUnreadChatNotificationsCount,
  markNotificationRead,
  markAllNotificationsRead,
  markProjectChatNotificationsRead,
} = require("../controllers/notificationController");

const router = express.Router();

router.get("/api/notifications", requireAuth, getNotifications);
router.get("/api/notifications/unread-count", requireAuth, getUnreadNotificationsCount);
router.patch("/api/notifications/:id/read", requireAuth, markNotificationRead);
router.patch("/api/notifications/read-all", requireAuth, markAllNotificationsRead);
router.get("/api/notifications/chat/unread-count", requireAuth, getUnreadChatNotificationsCount);
router.patch("/api/projects/:projectId/messages/read", requireAuth, markProjectChatNotificationsRead);

module.exports = router;