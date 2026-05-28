import React, { useEffect, useState } from "react";
import Card from "react-bootstrap/Card";
import Button from "react-bootstrap/Button";
import Badge from "react-bootstrap/Badge";
import Form from "react-bootstrap/Form";
import Spinner from "react-bootstrap/Spinner";
import Stack from "react-bootstrap/Stack";

function ProjectCard({
  project,
  statuses,
  canEdit,
  canManageMembers,
  isStatusSubmitting,
  isMembersOpen,
  isMessagesOpen,
  onEdit,
  onOpenMembers,
  onOpenMessages,
  onChangeStatus,
}) {
  const [statusDraft, setStatusDraft] = useState(project.status_id);

  useEffect(() => {
    setStatusDraft(project.status_id);
  }, [project.status_id]);

  const ownerName =
    `${project.owner_first_name || ""} ${project.owner_last_name || ""}`.trim() ||
    "Brak danych";

  return (
    <Card className="border h-100">
      <Card.Body className="d-flex flex-column">
        <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
          <div>
            <h5 className="mb-1">{project.name}</h5>
            <div className="text-muted small">Autor: {ownerName}</div>
          </div>

          <Badge bg="light" text="dark" className="border">
            {project.status_name}
          </Badge>
        </div>

        <p className="text-muted mb-3" style={{ minHeight: "72px" }}>
          {project.description || "Brak opisu projektu."}
        </p>

        <div className="small mb-3">
          <div>
            <strong>ID:</strong> {project.id}
          </div>
          <div>
            <strong>Członkowie:</strong> {project.members_count}
          </div>
        </div>

        {canEdit && (
          <div className="mb-3">
            <Form.Label className="small">Status projektu</Form.Label>
            <div className="d-flex gap-2">
              <Form.Select
                value={statusDraft}
                onChange={(event) => setStatusDraft(Number(event.target.value))}
                disabled={isStatusSubmitting}
              >
                {statuses.map((status) => (
                  <option key={status.id} value={status.id}>
                    {status.name}
                  </option>
                ))}
              </Form.Select>

              <Button
                variant="outline-dark"
                disabled={isStatusSubmitting || statusDraft === project.status_id}
                onClick={() => onChangeStatus(project.id, statusDraft)}
              >
                {isStatusSubmitting ? (
                  <>
                    <Spinner size="sm" className="me-2" />
                    Zmiana...
                  </>
                ) : (
                  "Zmień"
                )}
              </Button>
            </div>
          </div>
        )}

        <Stack direction="horizontal" gap={2} className="mt-auto flex-wrap">
          {canEdit && (
            <Button variant="dark" onClick={() => onEdit(project)}>
              Edytuj
            </Button>
          )}

          <Button
            variant={isMembersOpen ? "dark" : "outline-dark"}
            onClick={() => onOpenMembers(project)}
          >
            {canManageMembers ? "Członkowie" : "Podgląd członków"}
          </Button>

          <Button
            variant={isMessagesOpen ? "dark" : "outline-dark"}
            onClick={() => onOpenMessages(project)}
          >
            Wiadomości
          </Button>
        </Stack>
      </Card.Body>
    </Card>
  );
}

export default ProjectCard;