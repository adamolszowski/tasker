const sequelize = require("../db");
const { Notification } = require("../models");

function toPlain(modelInstance) {
  if (!modelInstance) {
    return null;
  }

  if (typeof modelInstance.get === "function") {
    return modelInstance.get({ plain: true });
  }

  return modelInstance;
}

async function findNotificationsForUser(userId, options = {}, transaction = null) {
  const unreadOnly = options.unreadOnly === true;
  const limit = Number(options.limit) > 0 ? Number(options.limit) : 50;

  const conditions = ["n.user_id = :userId"];
  const replacements = {
    userId,
    limit,
  };

  if (unreadOnly) {
    conditions.push("n.is_read = FALSE");
  }

  const whereClause = `WHERE ${conditions.join(" AND ")}`;

  const [rows] = await sequelize.query(
    `
    SELECT
        n.id,
        n.user_id,
        n.task_id,
        n.project_id,
        n.type,
        n.title,
        n.content,
        n.actor_name,
        n.source_text,
        n.is_read,
        n.read_at,
        n.created_at,
        t.title AS task_title,
        p.name AS project_name
    FROM notifications n
    LEFT JOIN tasks t ON t.id = n.task_id
    LEFT JOIN projects p ON p.id = n.project_id
    ${whereClause}
    ORDER BY n.created_at DESC, n.id DESC
    LIMIT :limit
    `,
    {
      replacements,
      transaction,
    }
  );

  return rows;
}

async function findNotificationById(notificationId, transaction = null) {
  const notification = await Notification.findByPk(notificationId, {
    transaction,
  });

  return toPlain(notification);
}

async function countUnreadNotifications(userId, transaction = null) {
  return Notification.count({
    where: {
      user_id: userId,
      is_read: false,
    },
    transaction,
  });
}

async function countUnreadProjectMessageNotifications(userId, transaction = null) {
  return Notification.count({
    where: {
      user_id: userId,
      is_read: false,
      type: "project_message_added",
    },
    transaction,
  });
}

async function markProjectMessageNotificationsAsRead(projectId, userId, transaction = null) {
  const [updatedCount] = await Notification.update(
    {
      is_read: true,
      read_at: new Date(),
    },
    {
      where: {
        user_id: userId,
        project_id: projectId,
        type: "project_message_added",
        is_read: false,
      },
      transaction,
    }
  );

  return updatedCount;
}

async function markNotificationAsRead(notificationId, userId, transaction = null) {
  const [updatedCount, updatedRows] = await Notification.update(
    {
      is_read: true,
      read_at: new Date(),
    },
    {
      where: {
        id: notificationId,
        user_id: userId,
      },
      returning: true,
      transaction,
    }
  );

  if (updatedCount === 0) {
    return null;
  }

  return toPlain(updatedRows[0]);
}

async function markAllNotificationsAsRead(userId, transaction = null) {
  const [updatedCount] = await Notification.update(
    {
      is_read: true,
      read_at: new Date(),
    },
    {
      where: {
        user_id: userId,
        is_read: false,
      },
      transaction,
    }
  );

  return updatedCount;
}

module.exports = {
  findNotificationsForUser,
  findNotificationById,
  countUnreadNotifications,
  countUnreadProjectMessageNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  markProjectMessageNotificationsAsRead,
};
