const sequelize = require("../db");
const { ProjectMessage, User, Role } = require("../models");

function toPlain(modelInstance) {
  if (!modelInstance) {
    return null;
  }

  if (typeof modelInstance.get === "function") {
    return modelInstance.get({ plain: true });
  }

  return modelInstance;
}

function flattenMessageWithAuthor(modelInstance) {
  const message = toPlain(modelInstance);

  if (!message) {
    return null;
  }

  return {
    ...message,
    first_name: message.author?.first_name || null,
    last_name: message.author?.last_name || null,
    role_name: message.author?.role?.name || null,
  };
}

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
  const message = await ProjectMessage.findByPk(messageId, {
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

  return flattenMessageWithAuthor(message);
}

async function createMessage(data, transaction) {
  const message = await ProjectMessage.create(
    {
      project_id: data.projectId,
      user_id: data.userId,
      content: data.content,
    },
    {
      transaction,
      returning: true,
    }
  );

  const created = toPlain(message);

  return {
    id: created.id,
  };
}

async function updateMessage(messageId, content, transaction) {
  await ProjectMessage.update(
    {
      content,
      is_edited: true,
      updated_at: new Date(),
    },
    {
      where: { id: messageId },
      transaction,
    }
  );
}

async function deleteMessage(messageId, transaction) {
  await ProjectMessage.destroy({
    where: { id: messageId },
    transaction,
  });
}

module.exports = {
  findMessagesByProjectId,
  findMessageById,
  createMessage,
  updateMessage,
  deleteMessage,
};
