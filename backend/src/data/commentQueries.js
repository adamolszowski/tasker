const sequelize = require("../db");

async function findCommentsByTaskId(taskId, transaction = null) {
  const [rows] = await sequelize.query(
    `
    SELECT
      c.id,
      c.task_id,
      c.user_id,
      c.content,
      c.is_edited,
      c.created_at,
      c.updated_at,
      u.first_name,
      u.last_name,
      r.name AS role_name
    FROM task_comments c
    JOIN users u ON u.id = c.user_id
    LEFT JOIN roles r ON r.id = u.role_id
    WHERE c.task_id = :taskId
    ORDER BY c.created_at ASC, c.id ASC
    `,
    {
      replacements: { taskId },
      transaction,
    }
  );

  return rows;
}

async function findCommentById(commentId, transaction = null) {
  const [rows] = await sequelize.query(
    `
    SELECT
      c.id,
      c.task_id,
      c.user_id,
      c.content,
      c.is_edited,
      c.created_at,
      c.updated_at,
      u.first_name,
      u.last_name,
      r.name AS role_name
    FROM task_comments c
    JOIN users u ON u.id = c.user_id
    LEFT JOIN roles r ON r.id = u.role_id
    WHERE c.id = :commentId
    LIMIT 1
    `,
    {
      replacements: { commentId },
      transaction,
    }
  );

  return rows[0] || null;
}

async function createComment(data, transaction) {
  const [rows] = await sequelize.query(
    `
    INSERT INTO task_comments (
      task_id,
      user_id,
      content
    )
    VALUES (
      :taskId,
      :userId,
      :content
    )
    RETURNING id
    `,
    {
      replacements: {
        taskId: data.taskId,
        userId: data.userId,
        content: data.content,
      },
      transaction,
    }
  );

  return rows[0] || null;
}

async function updateComment(commentId, content, transaction) {
  await sequelize.query(
    `
    UPDATE task_comments
    SET
      content = :content,
      is_edited = TRUE,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = :commentId
    `,
    {
      replacements: {
        commentId,
        content,
      },
      transaction,
    }
  );
}

async function deleteComment(commentId, transaction) {
  await sequelize.query(
    `
    DELETE FROM task_comments
    WHERE id = :commentId
    `,
    {
      replacements: { commentId },
      transaction,
    }
  );
}

module.exports = {
  findCommentsByTaskId,
  findCommentById,
  createComment,
  updateComment,
  deleteComment,
};
