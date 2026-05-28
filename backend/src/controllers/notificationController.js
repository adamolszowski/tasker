const sequelize = require("../db");
const {
  findNotificationsForUser,
  findNotificationById,
  countUnreadNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} = require("../data/notificationQueries");

function mapNotificationRow(notification) {
  return {
    id: notification.id,
    userId: notification.user_id,
    taskId: notification.task_id,
    projectId: notification.project_id,
    type: notification.type,
    title: notification.title,
    content: notification.content,
    actorName: notification.actor_name || null,
    sourceText: notification.source_text || null,
    isRead: notification.is_read,
    readAt: notification.read_at,
    createdAt: notification.created_at,
    taskTitle: notification.task_title || null,
    projectName: notification.project_name || null,
  };
}

async function getNotifications(req, res) {
  const unreadOnly = req.query.unreadOnly === "true";
  const limit = Number(req.query.limit) > 0 ? Number(req.query.limit) : 50;

  try {
    const notifications = await findNotificationsForUser(req.auth.sub, {
      unreadOnly,
      limit,
    });

    return res.status(200).json({
      notifications: notifications.map(mapNotificationRow),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Błąd podczas pobierania powiadomień.",
      error: error.message,
    });
  }
}

async function getUnreadNotificationsCount(req, res) {
  try {
    const unreadCount = await countUnreadNotifications(req.auth.sub);

    return res.status(200).json({
      unreadCount,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Błąd podczas pobierania licznika powiadomień.",
      error: error.message,
    });
  }
}

async function markNotificationReadHandler(req, res) {
  const notificationId = Number(req.params.id);

  if (!notificationId || Number.isNaN(notificationId)) {
    return res.status(400).json({
      message: "Nieprawidłowe ID powiadomienia.",
    });
  }

  const transaction = await sequelize.transaction();

  try {
    const notification = await findNotificationById(notificationId, transaction);

    if (!notification || notification.user_id !== req.auth.sub) {
      await transaction.rollback();
      return res.status(404).json({
        message: "Powiadomienie nie istnieje.",
      });
    }

    const updated = await markNotificationAsRead(notificationId, req.auth.sub, transaction);

    await transaction.commit();

    return res.status(200).json({
      message: "Powiadomienie zostało oznaczone jako przeczytane.",
      notification: updated,
    });
  } catch (error) {
    await transaction.rollback();
    return res.status(500).json({
      message: "Błąd podczas oznaczania powiadomienia.",
      error: error.message,
    });
  }
}

async function markAllNotificationsReadHandler(req, res) {
  const transaction = await sequelize.transaction();

  try {
    const updatedCount = await markAllNotificationsAsRead(req.auth.sub, transaction);

    await transaction.commit();

    return res.status(200).json({
      message: "Wszystkie powiadomienia zostały oznaczone jako przeczytane.",
      updatedCount,
    });
  } catch (error) {
    await transaction.rollback();
    return res.status(500).json({
      message: "Błąd podczas oznaczania wszystkich powiadomień.",
      error: error.message,
    });
  }
}

module.exports = {
  getNotifications,
  getUnreadNotificationsCount,
  markNotificationRead: markNotificationReadHandler,
  markAllNotificationsRead: markAllNotificationsReadHandler,
};
