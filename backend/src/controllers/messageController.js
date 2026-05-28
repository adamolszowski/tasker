const sequelize = require("../db");
const {
  findMessagesByProjectId,
  findMessageById,
  createMessage,
  updateMessage,
  deleteMessage,
} = require("../data/messageQueries");
const {
  findProjectById,
  isUserProjectMember,
} = require("../data/projectQueries");
const {
  validateCreateMessageInput,
  validateUpdateMessageInput,
} = require("../validators/messageValidators");
const {
  canViewProjectMessages,
  canCreateProjectMessage,
  canEditProjectMessage,
  canDeleteProjectMessage,
} = require("../permissions/messagePermissions");

function mapMessageRow(message) {
  return {
    id: message.id,
    projectId: message.project_id,
    authorUserId: message.user_id,
    content: message.content,
    isEdited: message.is_edited,
    createdAt: message.created_at,
    updatedAt: message.updated_at,
    authorFirstName: message.first_name,
    authorLastName: message.last_name,
    authorRoleName: message.role_name,
    authorName:
      message.first_name || message.last_name
        ? `${message.first_name || ""} ${message.last_name || ""}`.trim()
        : null,
  };
}

async function getProjectMessages(req, res) {
  const projectId = Number(req.params.projectId);

  if (!projectId || Number.isNaN(projectId)) {
    return res.status(400).json({
      message: "Nieprawidłowe ID projektu.",
    });
  }

  try {
    const project = await findProjectById(projectId);

    if (!project) {
      return res.status(404).json({
        message: "Projekt nie istnieje.",
      });
    }

    const isMember = await isUserProjectMember(projectId, req.auth.sub);

    if (!canViewProjectMessages({ id: req.auth.sub, role: req.auth.role }, project, isMember)) {
      return res.status(403).json({
        message: "Brak uprawnień do podglądu wiadomości tego projektu.",
      });
    }

    const messages = await findMessagesByProjectId(projectId);

    return res.status(200).json({
      messages: messages.map(mapMessageRow),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Błąd podczas pobierania wiadomości projektu.",
      error: error.message,
    });
  }
}

async function createMessageHandler(req, res) {
  const projectId = Number(req.params.projectId);

  if (!projectId || Number.isNaN(projectId)) {
    return res.status(400).json({
      message: "Nieprawidłowe ID projektu.",
    });
  }

  const validation = validateCreateMessageInput(req.body);

  if (validation.error) {
    return res.status(400).json({
      message: validation.error,
    });
  }

  const transaction = await sequelize.transaction();

  try {
    const project = await findProjectById(projectId, transaction);

    if (!project) {
      await transaction.rollback();
      return res.status(404).json({
        message: "Projekt nie istnieje.",
      });
    }

    const isMember = await isUserProjectMember(projectId, req.auth.sub, transaction);

    if (!canCreateProjectMessage({ id: req.auth.sub, role: req.auth.role }, project, isMember)) {
      await transaction.rollback();
      return res.status(403).json({
        message: "Brak uprawnień do dodania wiadomości do tego projektu.",
      });
    }

    const created = await createMessage(
      {
        projectId,
        userId: req.auth.sub,
        content: validation.data.content,
      },
      transaction
    );

    const message = await findMessageById(created.id, transaction);

    await transaction.commit();

    return res.status(201).json({
      message: "Wiadomość została dodana.",
      messageItem: mapMessageRow(message),
    });
  } catch (error) {
    await transaction.rollback();
    return res.status(500).json({
      message: "Błąd podczas dodawania wiadomości.",
      error: error.message,
    });
  }
}

async function updateMessageHandler(req, res) {
  const messageId = Number(req.params.messageId);

  if (!messageId || Number.isNaN(messageId)) {
    return res.status(400).json({
      message: "Nieprawidłowe ID wiadomości.",
    });
  }

  const validation = validateUpdateMessageInput(req.body);

  if (validation.error) {
    return res.status(400).json({
      message: validation.error,
    });
  }

  const transaction = await sequelize.transaction();

  try {
    const message = await findMessageById(messageId, transaction);

    if (!message) {
      await transaction.rollback();
      return res.status(404).json({
        message: "Wiadomość nie istnieje.",
      });
    }

    const project = await findProjectById(message.project_id, transaction);

    if (!project) {
      await transaction.rollback();
      return res.status(404).json({
        message: "Projekt nie istnieje.",
      });
    }

    if (!canEditProjectMessage({ id: req.auth.sub, role: req.auth.role }, message, project)) {
      await transaction.rollback();
      return res.status(403).json({
        message: "Brak uprawnień do edycji tej wiadomości.",
      });
    }

    await updateMessage(messageId, validation.data.content, transaction);
    const updatedMessage = await findMessageById(messageId, transaction);

    await transaction.commit();

    return res.status(200).json({
      message: "Wiadomość została zaktualizowana.",
      messageItem: mapMessageRow(updatedMessage),
    });
  } catch (error) {
    await transaction.rollback();
    return res.status(500).json({
      message: "Błąd podczas aktualizacji wiadomości.",
      error: error.message,
    });
  }
}

async function deleteMessageHandler(req, res) {
  const messageId = Number(req.params.messageId);

  if (!messageId || Number.isNaN(messageId)) {
    return res.status(400).json({
      message: "Nieprawidłowe ID wiadomości.",
    });
  }

  const transaction = await sequelize.transaction();

  try {
    const message = await findMessageById(messageId, transaction);

    if (!message) {
      await transaction.rollback();
      return res.status(404).json({
        message: "Wiadomość nie istnieje.",
      });
    }

    const project = await findProjectById(message.project_id, transaction);

    if (!project) {
      await transaction.rollback();
      return res.status(404).json({
        message: "Projekt nie istnieje.",
      });
    }

    if (!canDeleteProjectMessage({ id: req.auth.sub, role: req.auth.role }, message, project)) {
      await transaction.rollback();
      return res.status(403).json({
        message: "Brak uprawnień do usunięcia tej wiadomości.",
      });
    }

    await deleteMessage(messageId, transaction);
    await transaction.commit();

    return res.status(200).json({
      message: "Wiadomość została usunięta.",
    });
  } catch (error) {
    await transaction.rollback();
    return res.status(500).json({
      message: "Błąd podczas usuwania wiadomości.",
      error: error.message,
    });
  }
}

module.exports = {
  getProjectMessages,
  createMessage: createMessageHandler,
  updateMessage: updateMessageHandler,
  deleteMessage: deleteMessageHandler,
};