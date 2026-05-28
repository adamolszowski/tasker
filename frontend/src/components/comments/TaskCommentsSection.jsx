import React, { useEffect, useMemo, useState } from "react";
import Card from "react-bootstrap/Card";
import Alert from "react-bootstrap/Alert";
import Button from "react-bootstrap/Button";
import Spinner from "react-bootstrap/Spinner";
import CommentForm from "./CommentForm";
import CommentItem from "./CommentItem";
import {
  getTaskComments,
  createComment,
  updateComment,
  deleteComment,
} from "../../api/commentsApi";

function TaskCommentsSection({
  authToken,
  task,
  authenticatedUser,
  canModerateComments,
  onClose,
}) {
  const [comments, setComments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState(null);
  const [newCommentContent, setNewCommentContent] = useState("");
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingContent, setEditingContent] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const isAdminLike =
    authenticatedUser?.role === "administrator" ||
    authenticatedUser?.role === "superadmin";

  const canManageComment = useMemo(() => {
    return (comment) => {
      if (!authenticatedUser || !comment) {
        return false;
      }

      if (isAdminLike) {
        return true;
      }

      if (comment.authorUserId === authenticatedUser.id) {
        return true;
      }

      return canModerateComments === true;
    };
  }, [authenticatedUser, canModerateComments, isAdminLike]);

  useEffect(() => {
    const loadComments = async () => {
      if (!task || !task.id || !authToken) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setErrorMessage("");
        setSuccessMessage("");
        const data = await getTaskComments(authToken, task.id);
        setComments(data.comments || []);
      } catch (error) {
        setErrorMessage(error.message || "Nie udało się pobrać komentarzy.");
      } finally {
        setIsLoading(false);
      }
    };

    loadComments();
  }, [authToken, task?.id]);

  const handleCreateComment = async (event) => {
    event.preventDefault();

    if (!newCommentContent.trim()) {
      setErrorMessage("Treść komentarza jest wymagana.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage("");
      setSuccessMessage("");

      const data = await createComment(authToken, task.id, {
        content: newCommentContent.trim(),
      });

      setComments((prev) => [...prev, data.comment]);
      setNewCommentContent("");
      setSuccessMessage(data.message || "Komentarz został dodany.");
    } catch (error) {
      setErrorMessage(error.message || "Nie udało się dodać komentarza.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEdit = (comment) => {
    setEditingCommentId(comment.id);
    setEditingContent(comment.content || "");
    setErrorMessage("");
    setSuccessMessage("");
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditingContent("");
  };

  const handleSaveEdit = async (event) => {
    event.preventDefault();

    if (!editingContent.trim()) {
      setErrorMessage("Treść komentarza jest wymagana.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage("");
      setSuccessMessage("");

      const data = await updateComment(authToken, editingCommentId, {
        content: editingContent.trim(),
      });

      setComments((prev) =>
        prev.map((comment) =>
          comment.id === editingCommentId ? data.comment : comment
        )
      );
      setEditingCommentId(null);
      setEditingContent("");
      setSuccessMessage(data.message || "Komentarz został zaktualizowany.");
    } catch (error) {
      setErrorMessage(error.message || "Nie udało się zaktualizować komentarza.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      setDeletingCommentId(commentId);
      setErrorMessage("");
      setSuccessMessage("");

      const data = await deleteComment(authToken, commentId);
      setComments((prev) => prev.filter((comment) => comment.id !== commentId));
      setSuccessMessage(data.message || "Komentarz został usunięty.");
    } catch (error) {
      setErrorMessage(error.message || "Nie udało się usunąć komentarza.");
    } finally {
      setDeletingCommentId(null);
    }
  };

  return (
    <Card className="mt-4 border">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
          <div>
            <h4 className="mb-1">Komentarze do zadania</h4>
            <p className="text-muted mb-0">
              {task?.title || "Wybrane zadanie"}
            </p>
          </div>

          <Button variant="outline-secondary" onClick={onClose}>
            Zamknij
          </Button>
        </div>

        {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
        {successMessage && <Alert variant="success">{successMessage}</Alert>}

        <div className="mb-4">
          <CommentForm
            value={newCommentContent}
            onChange={setNewCommentContent}
            onSubmit={handleCreateComment}
            isSubmitting={isSubmitting}
            submitLabel="Dodaj komentarz"
            placeholder="Wpisz komentarz do zadania..."
          />
        </div>

        {isLoading ? (
          <div className="text-center py-3">
            <Spinner className="me-2" />
            Ładowanie komentarzy...
          </div>
        ) : comments.length === 0 ? (
          <Alert variant="secondary" className="mb-0">
            Brak komentarzy do tego zadania.
          </Alert>
        ) : (
          <div className="d-flex flex-column gap-3">
            {comments.map((comment) => {
              const canManage = canManageComment(comment);

              if (editingCommentId === comment.id) {
                return (
                  <Card key={comment.id} className="border">
                    <Card.Body>
                      <div className="mb-3 fw-semibold">Edycja komentarza</div>
                      <CommentForm
                        value={editingContent}
                        onChange={setEditingContent}
                        onSubmit={handleSaveEdit}
                        onCancel={handleCancelEdit}
                        isSubmitting={isSubmitting}
                        submitLabel="Zapisz zmiany"
                        placeholder="Edytuj treść komentarza..."
                      />
                    </Card.Body>
                  </Card>
                );
              }

              return (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  canEdit={canManage}
                  canDelete={canManage}
                  onEdit={handleStartEdit}
                  onDelete={handleDeleteComment}
                  isDeleting={deletingCommentId === comment.id}
                />
              );
            })}
          </div>
        )}
      </Card.Body>
    </Card>
  );
}

export default TaskCommentsSection;
