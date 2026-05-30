const sequelize = require("../db");
const { TaskComment, User, Role } = require("../models");

function toPlain(modelInstance) {
  if (!modelInstance) {
    return null;
  }

  if (typeof modelInstance.get === "function") {
    return modelInstance.get({ plain: true });
  }

  return modelInstance;
}

function flattenCommentWithAuthor(modelInstance) {
  const comment = toPlain(modelInstance);

  if (!comment) {
    return null;
  }

  return {
    ...comment,
    first_name: comment.author?.first_name || null,
    last_name: comment.author?.last_name || null,
    role_name: comment.author?.role?.name || null,
  };
}

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
  const comment = await TaskComment.findByPk(commentId, {
    include: [
      {
        model: User,
        as: "author",
        attributes: ["id", "first_name", "last_name", "role_id"],
        required: true,
        include: [
          {
            model: Role,
            as: "role",
            attributes: ["id", "name"],
            required: false,
          },
        ],
      },
    ],
    transaction,
  });

  return flattenCommentWithAuthor(comment);
}

async function createComment(data, transaction) {
  const comment = await TaskComment.create(
    {
      task_id: data.taskId,
      user_id: data.userId,
      content: data.content,
    },
    {
      transaction,
      returning: true,
    }
  );

  const created = toPlain(comment);

  return {
    id: created.id,
  };
}

async function updateComment(commentId, content, transaction) {
  await TaskComment.update(
    {
      content,
      is_edited: true,
      updated_at: new Date(),
    },
    {
      where: { id: commentId },
      transaction,
    }
  );
}

async function deleteComment(commentId, transaction) {
  await TaskComment.destroy({
    where: { id: commentId },
    transaction,
  });
}

module.exports = {
  findCommentsByTaskId,
  findCommentById,
  createComment,
  updateComment,
  deleteComment,
};
