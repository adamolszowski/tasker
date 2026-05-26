const sequelize = require("../db");
const {
  findCommentsByTaskId,
  findCommentById,
  createComment,
  updateComment,
  deleteComment,
} = require("../data/commentQueries");
const {
  findTaskById,
  findProjectContextById,
  isUserProjectMember,
} = require("../data/taskQueries");
const {
  validateCreateCommentInput,
  validateUpdateCommentInput,
} = require("../validators/commentValidators");
const {
  canViewComments,
  canCreateComment,
  canEditComment,
  canDeleteComment,
} = require("../permissions/commentPermissions");

function mapCommentRow(comment) {
  return {
    id: comment.id,
    taskId: comment.task_id,
    authorUserId: comment.user_id,
    content: comment.content,
    isEdited: comment.is_edited,
    createdAt: comment.created_at,
    updatedAt: comment.updated_at,
    authorFirstName: comment.first_name,
    authorLastName: comment.last_name,
    authorRoleName: comment.role_name,
    authorName:
      comment.first_name || comment.last_name
        ? `${comment.first_name || ""} ${comment.last_name || ""}`.trim()
        : null,
  };
}

async function getTaskComments(req, res) {
  const taskId = Number(req.params.taskId);

  if (!taskId || Number.isNaN(taskId)) {
    return res.status(400).json({
      message: "Nieprawidłowe ID zadania.",
    });
  }

  try {
    const task = await findTaskById(taskId);

    if (!task) {
      return res.status(404).json({
        message: "Zadanie nie istnieje.",
      });
    }

    const project = await findProjectContextById(task.project_id);
    const isMember = await isUserProjectMember(task.project_id, req.auth.sub);

    if (!canViewComments({ id: req.auth.sub, role: req.auth.role }, project, isMember)) {
      return res.status(403).json({
        message: "Brak uprawnień do podglądu komentarzy tego zadania.",
      });
    }

    const comments = await findCommentsByTaskId(taskId);

    return res.status(200).json({
      comments: comments.map(mapCommentRow),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Błąd podczas pobierania komentarzy.",
      error: error.message,
    });
  }
}

async function createCommentHandler(req, res) {
  const taskId = Number(req.params.taskId);

  if (!taskId || Number.isNaN(taskId)) {
    return res.status(400).json({
      message: "Nieprawidłowe ID zadania.",
    });
  }

  const validation = validateCreateCommentInput(req.body);

  if (validation.error) {
    return res.status(400).json({
      message: validation.error,
    });
  }

  const transaction = await sequelize.transaction();

  try {
    const task = await findTaskById(taskId, transaction);

    if (!task) {
      await transaction.rollback();
      return res.status(404).json({
        message: "Zadanie nie istnieje.",
      });
    }

    const project = await findProjectContextById(task.project_id, transaction);
    const isMember = await isUserProjectMember(task.project_id, req.auth.sub, transaction);

    if (!canCreateComment({ id: req.auth.sub, role: req.auth.role }, project, isMember)) {
      await transaction.rollback();
      return res.status(403).json({
        message: "Brak uprawnień do dodania komentarza do tego zadania.",
      });
    }

    const created = await createComment(
      {
        taskId,
        userId: req.auth.sub,
        content: validation.data.content,
      },
      transaction
    );

    const comment = await findCommentById(created.id, transaction);

    await transaction.commit();

    return res.status(201).json({
      message: "Komentarz został dodany.",
      comment: mapCommentRow(comment),
    });
  } catch (error) {
    await transaction.rollback();
    return res.status(500).json({
      message: "Błąd podczas dodawania komentarza.",
      error: error.message,
    });
  }
}

async function updateCommentHandler(req, res) {
  const commentId = Number(req.params.commentId);

  if (!commentId || Number.isNaN(commentId)) {
    return res.status(400).json({
      message: "Nieprawidłowe ID komentarza.",
    });
  }

  const validation = validateUpdateCommentInput(req.body);

  if (validation.error) {
    return res.status(400).json({
      message: validation.error,
    });
  }

  const transaction = await sequelize.transaction();

  try {
    const comment = await findCommentById(commentId, transaction);

    if (!comment) {
      await transaction.rollback();
      return res.status(404).json({
        message: "Komentarz nie istnieje.",
      });
    }

    const task = await findTaskById(comment.task_id, transaction);

    if (!task) {
      await transaction.rollback();
      return res.status(404).json({
        message: "Zadanie nie istnieje.",
      });
    }

    const project = await findProjectContextById(task.project_id, transaction);

    if (!canEditComment({ id: req.auth.sub, role: req.auth.role }, comment, project)) {
      await transaction.rollback();
      return res.status(403).json({
        message: "Brak uprawnień do edycji tego komentarza.",
      });
    }

    await updateComment(commentId, validation.data.content, transaction);
    const updatedComment = await findCommentById(commentId, transaction);

    await transaction.commit();

    return res.status(200).json({
      message: "Komentarz został zaktualizowany.",
      comment: mapCommentRow(updatedComment),
    });
  } catch (error) {
    await transaction.rollback();
    return res.status(500).json({
      message: "Błąd podczas aktualizacji komentarza.",
      error: error.message,
    });
  }
}

async function deleteCommentHandler(req, res) {
  const commentId = Number(req.params.commentId);

  if (!commentId || Number.isNaN(commentId)) {
    return res.status(400).json({
      message: "Nieprawidłowe ID komentarza.",
    });
  }

  const transaction = await sequelize.transaction();

  try {
    const comment = await findCommentById(commentId, transaction);

    if (!comment) {
      await transaction.rollback();
      return res.status(404).json({
        message: "Komentarz nie istnieje.",
      });
    }

    const task = await findTaskById(comment.task_id, transaction);

    if (!task) {
      await transaction.rollback();
      return res.status(404).json({
        message: "Zadanie nie istnieje.",
      });
    }

    const project = await findProjectContextById(task.project_id, transaction);

    if (!canDeleteComment({ id: req.auth.sub, role: req.auth.role }, comment, project)) {
      await transaction.rollback();
      return res.status(403).json({
        message: "Brak uprawnień do usunięcia tego komentarza.",
      });
    }

    await deleteComment(commentId, transaction);
    await transaction.commit();

    return res.status(200).json({
      message: "Komentarz został usunięty.",
    });
  } catch (error) {
    await transaction.rollback();
    return res.status(500).json({
      message: "Błąd podczas usuwania komentarza.",
      error: error.message,
    });
  }
}

module.exports = {
  getTaskComments,
  createComment: createCommentHandler,
  updateComment: updateCommentHandler,
  deleteComment: deleteCommentHandler,
};
