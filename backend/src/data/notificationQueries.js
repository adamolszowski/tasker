const sequelize = require("../db");

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
  const [rows] = await sequelize.query(
    `
    SELECT
      id,
      user_id,
      task_id,
      project_id,
      type,
      title,
      content,
      is_read,
      read_at,
      created_at
    FROM notifications
    WHERE id = :notificationId
    LIMIT 1
    `,
    {
      replacements: { notificationId },
      transaction,
    }
  );

  return rows[0] || null;
}

async function countUnreadNotifications(userId, transaction = null) {
  const [rows] = await sequelize.query(
    `
    SELECT COUNT(*)::int AS unread_count
    FROM notifications
    WHERE user_id = :userId
      AND is_read = FALSE
    `,
    {
      replacements: { userId },
      transaction,
    }
  );

  return rows[0]?.unread_count || 0;
}

async function markNotificationAsRead(notificationId, userId, transaction = null) {
  const [rows] = await sequelize.query(
    `
    UPDATE notifications
    SET
      is_read = TRUE,
      read_at = CURRENT_TIMESTAMP
    WHERE id = :notificationId
      AND user_id = :userId
    RETURNING id, is_read, read_at
    `,
    {
      replacements: {
        notificationId,
        userId,
      },
      transaction,
    }
  );

  return rows[0] || null;
}

async function markAllNotificationsAsRead(userId, transaction = null) {
  const [rows] = await sequelize.query(
    `
    UPDATE notifications
    SET
      is_read = TRUE,
      read_at = CURRENT_TIMESTAMP
    WHERE user_id = :userId
      AND is_read = FALSE
    RETURNING id
    `,
    {
      replacements: { userId },
      transaction,
    }
  );

  return rows.length;
}

module.exports = {
  findNotificationsForUser,
  findNotificationById,
  countUnreadNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
};
