const sequelize = require("../db");

async function findMessagesByProjectId(projectId, transaction = null) {
  const [rows] = await sequelize.query(
    `
    SELECT
      m.id,
      m.project_id,
      m.user_id,
      m.content,
      m.is_edited,
      m.created_at,
      m.updated_at,
      u.first_name,
      u.last_name,
      r.name AS role_name
    FROM project_messages m
    JOIN users u ON u.id = m.user_id
    LEFT JOIN roles r ON r.id = u.role_id
    WHERE m.project_id = :projectId
    ORDER BY m.created_at ASC, m.id ASC
    `,
    {
      replacements: { projectId },
      transaction,
    }
  );

  return rows;
}

async function findMessageById(messageId, transaction = null) {
  const [rows] = await sequelize.query(
    `
    SELECT
      m.id,
      m.project_id,
      m.user_id,
      m.content,
      m.is_edited,
      m.created_at,
      m.updated_at,
      u.first_name,
      u.last_name,
      r.name AS role_name
    FROM project_messages m
    JOIN users u ON u.id = m.user_id
    LEFT JOIN roles r ON r.id = u.role_id
    WHERE m.id = :messageId
    LIMIT 1
    `,
    {
      replacements: { messageId },
      transaction,
    }
  );

  return rows[0] || null;
}

async function createMessage(data, transaction) {
  const [rows] = await sequelize.query(
    `
    INSERT INTO project_messages (
      project_id,
      user_id,
      content
    )
    VALUES (
      :projectId,
      :userId,
      :content
    )
    RETURNING id
    `,
    {
      replacements: {
        projectId: data.projectId,
        userId: data.userId,
        content: data.content,
      },
      transaction,
    }
  );

  return rows[0] || null;
}

async function updateMessage(messageId, content, transaction) {
  await sequelize.query(
    `
    UPDATE project_messages
    SET
      content = :content,
      is_edited = TRUE,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = :messageId
    `,
    {
      replacements: {
        messageId,
        content,
      },
      transaction,
    }
  );
}

async function deleteMessage(messageId, transaction) {
  await sequelize.query(
    `
    DELETE FROM project_messages
    WHERE id = :messageId
    `,
    {
      replacements: { messageId },
      transaction,
    }
  );
}

module.exports = {
  findMessagesByProjectId,
  findMessageById,
  createMessage,
  updateMessage,
  deleteMessage,
};