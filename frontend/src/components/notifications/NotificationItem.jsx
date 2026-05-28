import React from "react";
import Card from "react-bootstrap/Card";
import Badge from "react-bootstrap/Badge";
import Button from "react-bootstrap/Button";
import Spinner from "react-bootstrap/Spinner";

function formatNotificationDate(value) {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleString("pl-PL");
}

function getTypeLabel(type) {
  switch (type) {
    case "task_assigned":
      return "Przypisanie zadania";
    case "task_status_changed":
      return "Zmiana statusu";
    case "task_comment_added":
      return "Komentarz";
    case "project_message_added":
      return "Wiadomość projektu";
    case "task_due_soon":
      return "Termin zadania";
    default:
      return "Powiadomienie";
  }
}

function NotificationItem({ notification, isMarkingRead, onMarkRead }) {
  return (
    <Card className={`border ${notification.isRead ? "bg-light" : ""}`}>
      <Card.Body>
        <div className="d-flex justify-content-between align-items-start gap-3 mb-2">
          <div>
            <div className="fw-semibold">{notification.title}</div>
            <div className="small text-muted">
              {formatNotificationDate(notification.createdAt)}
            </div>
          </div>

          <div className="d-flex gap-2 align-items-center">
            <Badge bg="light" text="dark" className="border">
              {getTypeLabel(notification.type)}
            </Badge>

            {!notification.isRead && <Badge bg="dark">Nowe</Badge>}
          </div>
        </div>

        <div className="mb-2">{notification.content}</div>

        <div className="small text-muted mb-3">
          {notification.type === "task_comment_added" ? (
            <>
              <div>
                <strong>Projekt:</strong> {notification.projectName || "-"}
              </div>
              <div>
                <strong>Zadanie:</strong> {notification.taskTitle || "-"}
              </div>
              <div>
                <strong>Autor komentarza:</strong>{" "}
                {notification.actorName || "-"}
              </div>
              <div>
                <strong>Treść komentarza:</strong>{" "}
                {notification.sourceText || "-"}
              </div>
            </>
          ) : notification.type === "project_message_added" ? (
            <>
              <div>
                <strong>Projekt:</strong> {notification.projectName || "-"}
              </div>
              <div>
                <strong>Autor wiadomości:</strong>{" "}
                {notification.actorName || "-"}
              </div>
              <div>
                <strong>Treść wiadomości:</strong>{" "}
                {notification.sourceText || "-"}
              </div>
            </>
          ) : (
            <>
              {notification.projectName && (
                <div>
                  <strong>Projekt:</strong> {notification.projectName}
                </div>
              )}

              {notification.taskTitle && (
                <div>
                  <strong>Zadanie:</strong> {notification.taskTitle}
                </div>
              )}
            </>
          )}
        </div>

        {!notification.isRead && (
          <Button
            variant="outline-dark"
            size="sm"
            disabled={isMarkingRead}
            onClick={() => onMarkRead(notification.id)}
          >
            {isMarkingRead ? (
              <>
                <Spinner size="sm" className="me-2" />
                Oznaczanie...
              </>
            ) : (
              "Oznacz jako przeczytane"
            )}
          </Button>
        )}
      </Card.Body>
    </Card>
  );
}

export default NotificationItem;
