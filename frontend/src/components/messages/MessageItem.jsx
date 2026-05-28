import React from "react";
import Card from "react-bootstrap/Card";
import Button from "react-bootstrap/Button";
import Badge from "react-bootstrap/Badge";
import Spinner from "react-bootstrap/Spinner";

function formatDate(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString("pl-PL");
}

function MessageItem({
  message,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
  isDeleting,
}) {
  return (
    <Card className="border">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-start gap-3 mb-2">
          <div>
            <div className="fw-semibold">{message.authorName || "Użytkownik"}</div>
            <div className="small text-muted d-flex gap-2 flex-wrap">
              <span>{formatDate(message.createdAt)}</span>
              {message.authorRoleName && (
                <Badge bg="light" text="dark" className="border">
                  {message.authorRoleName}
                </Badge>
              )}
              {message.isEdited && <span>(edytowano)</span>}
            </div>
          </div>
        </div>

        <div className="mb-3" style={{ whiteSpace: "pre-wrap" }}>
          {message.content}
        </div>

        <div className="d-flex gap-2 flex-wrap">
          {canEdit && (
            <Button variant="dark" size="sm" onClick={() => onEdit(message)}>
              Edytuj
            </Button>
          )}

          {canDelete && (
            <Button
              variant="outline-danger"
              size="sm"
              disabled={isDeleting}
              onClick={() => onDelete(message.id)}
            >
              {isDeleting ? (
                <>
                  <Spinner size="sm" className="me-2" />
                  Usuwanie...
                </>
              ) : (
                "Usuń"
              )}
            </Button>
          )}
        </div>
      </Card.Body>
    </Card>
  );
}

export default MessageItem;