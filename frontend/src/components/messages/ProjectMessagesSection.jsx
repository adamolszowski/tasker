import React, { useEffect, useMemo, useState } from "react";
import Card from "react-bootstrap/Card";
import Alert from "react-bootstrap/Alert";
import Button from "react-bootstrap/Button";
import Spinner from "react-bootstrap/Spinner";
import MessageForm from "./MessageForm";
import MessageItem from "./MessageItem";
import {
  getProjectMessages,
  createMessage,
  updateMessage,
  deleteMessage,
} from "../../api/messagesApi";

function ProjectMessagesSection({
  authToken,
  project,
  authenticatedUser,
  canModerateMessages,
  onClose,
}) {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingMessageId, setDeletingMessageId] = useState(null);
  const [newMessageContent, setNewMessageContent] = useState("");
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingContent, setEditingContent] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const isAdminLike =
    authenticatedUser?.role === "administrator" ||
    authenticatedUser?.role === "superadmin";

  const canManageMessage = useMemo(() => {
    return (message) => {
      if (!authenticatedUser || !message) {
        return false;
      }

      if (isAdminLike) {
        return true;
      }

      if (message.authorUserId === authenticatedUser.id) {
        return true;
      }

      return canModerateMessages === true;
    };
  }, [authenticatedUser, canModerateMessages, isAdminLike]);

  useEffect(() => {
    const loadMessages = async () => {
      if (!project || !project.id || !authToken) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setErrorMessage("");
        setSuccessMessage("");
        const data = await getProjectMessages(authToken, project.id);
        setMessages(data.messages || []);
      } catch (error) {
        setErrorMessage(error.message || "Nie udało się pobrać wiadomości projektu.");
      } finally {
        setIsLoading(false);
      }
    };

    loadMessages();
  }, [authToken, project?.id]);

  const handleCreateMessage = async (event) => {
    event.preventDefault();

    if (!newMessageContent.trim()) {
      setErrorMessage("Treść wiadomości jest wymagana.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage("");
      setSuccessMessage("");

      const data = await createMessage(authToken, project.id, {
        content: newMessageContent.trim(),
      });

      setMessages((prev) => [...prev, data.messageItem]);
      setNewMessageContent("");
      setSuccessMessage(data.message || "Wiadomość została dodana.");
    } catch (error) {
      setErrorMessage(error.message || "Nie udało się dodać wiadomości.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEdit = (message) => {
    setEditingMessageId(message.id);
    setEditingContent(message.content || "");
    setErrorMessage("");
    setSuccessMessage("");
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditingContent("");
  };

  const handleSaveEdit = async (event) => {
    event.preventDefault();

    if (!editingContent.trim()) {
      setErrorMessage("Treść wiadomości jest wymagana.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage("");
      setSuccessMessage("");

      const data = await updateMessage(authToken, editingMessageId, {
        content: editingContent.trim(),
      });

      setMessages((prev) =>
        prev.map((message) =>
          message.id === editingMessageId ? data.messageItem : message
        )
      );
      setEditingMessageId(null);
      setEditingContent("");
      setSuccessMessage(data.message || "Wiadomość została zaktualizowana.");
    } catch (error) {
      setErrorMessage(error.message || "Nie udało się zaktualizować wiadomości.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      setDeletingMessageId(messageId);
      setErrorMessage("");
      setSuccessMessage("");

      const data = await deleteMessage(authToken, messageId);
      setMessages((prev) => prev.filter((message) => message.id !== messageId));
      setSuccessMessage(data.message || "Wiadomość została usunięta.");
    } catch (error) {
      setErrorMessage(error.message || "Nie udało się usunąć wiadomości.");
    } finally {
      setDeletingMessageId(null);
    }
  };

  return (
    <Card className="mt-4 border">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
          <div>
            <h4 className="mb-1">Wiadomości projektu</h4>
            <p className="text-muted mb-0">
              {project?.name || "Wybrany projekt"}
            </p>
          </div>

          <Button variant="outline-secondary" onClick={onClose}>
            Zamknij
          </Button>
        </div>

        {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
        {successMessage && <Alert variant="success">{successMessage}</Alert>}

        <div className="mb-4">
          <MessageForm
            value={newMessageContent}
            onChange={setNewMessageContent}
            onSubmit={handleCreateMessage}
            isSubmitting={isSubmitting}
            submitLabel="Dodaj wiadomość"
            placeholder="Wpisz wiadomość do projektu..."
          />
        </div>

        {isLoading ? (
          <div className="text-center py-3">
            <Spinner className="me-2" />
            Ładowanie wiadomości...
          </div>
        ) : messages.length === 0 ? (
          <Alert variant="secondary" className="mb-0">
            Brak wiadomości w tym projekcie.
          </Alert>
        ) : (
          <div className="d-flex flex-column gap-3">
            {messages.map((message) => {
              const canManage = canManageMessage(message);

              if (editingMessageId === message.id) {
                return (
                  <Card key={message.id} className="border">
                    <Card.Body>
                      <div className="mb-3 fw-semibold">Edycja wiadomości</div>
                      <MessageForm
                        value={editingContent}
                        onChange={setEditingContent}
                        onSubmit={handleSaveEdit}
                        onCancel={handleCancelEdit}
                        isSubmitting={isSubmitting}
                        submitLabel="Zapisz zmiany"
                        placeholder="Edytuj treść wiadomości..."
                      />
                    </Card.Body>
                  </Card>
                );
              }

              return (
                <MessageItem
                  key={message.id}
                  message={message}
                  canEdit={canManage}
                  canDelete={canManage}
                  onEdit={handleStartEdit}
                  onDelete={handleDeleteMessage}
                  isDeleting={deletingMessageId === message.id}
                />
              );
            })}
          </div>
        )}
      </Card.Body>
    </Card>
  );
}

export default ProjectMessagesSection;