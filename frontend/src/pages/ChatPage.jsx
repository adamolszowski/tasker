import React, { useEffect, useMemo, useState } from "react";
import Card from "react-bootstrap/Card";
import Alert from "react-bootstrap/Alert";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Badge from "react-bootstrap/Badge";
import Spinner from "react-bootstrap/Spinner";
import ProjectMessagesSection from "../components/messages/ProjectMessagesSection";
import { getProjects } from "../api/projectsApi";
import { markProjectMessagesNotificationsRead } from "../api/notificationsApi";

function ChatPage({
  authToken,
  authenticatedUser,
  onChatNotificationsChanged,
}) {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const isAdminLike =
    authenticatedUser?.role === "administrator" ||
    authenticatedUser?.role === "superadmin";

    const selectedProject = useMemo(() => {
    if (!selectedProjectId) {
        return null;
    }

    return (
        projects.find((project) => String(project.id) === String(selectedProjectId)) ||
        null
    );
    }, [projects, selectedProjectId]);

  const canModerateMessages = useMemo(() => {
    if (!authenticatedUser || !selectedProject) {
      return false;
    }

    if (isAdminLike) {
      return true;
    }

    return (
    authenticatedUser.role === "kierownik" &&
    Number(selectedProject.created_by_user_id) === Number(authenticatedUser.id)
    );
  }, [authenticatedUser, selectedProject, isAdminLike]);

  useEffect(() => {
    const loadProjects = async () => {
      if (!authToken || !authenticatedUser) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setErrorMessage("");

        const data = await getProjects(authToken);
        setProjects(data.projects || []);
      } catch (error) {
        setErrorMessage(error.message || "Nie udało się pobrać projektów.");
      } finally {
        setIsLoading(false);
      }
    };

    loadProjects();
  }, [authToken, authenticatedUser?.id]);

  useEffect(() => {
    const markChatNotificationsRead = async () => {
      if (!authToken || !selectedProject?.id) {
        return;
      }

      try {
        await markProjectMessagesNotificationsRead(authToken, selectedProject.id);

        if (onChatNotificationsChanged) {
          await onChatNotificationsChanged();
        }
      } catch (error) {
        // Nie pokazujemy błędu, bo wiadomości mogą się normalnie załadować.
        // To tylko pomocnicze oznaczanie powiadomień jako przeczytanych.
      }
    };

    markChatNotificationsRead();
  }, [authToken, selectedProject?.id, onChatNotificationsChanged]);

  if (!authenticatedUser) {
    return (
      <Alert variant="warning">
        Musisz być zalogowany, aby korzystać z czatu.
      </Alert>
    );
  }

  return (
    <div>
      <Card className="mb-4 border">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
            <div>
              <h2 className="mb-1">CZAT PROJEKTOWY</h2>
              <p className="text-muted mb-0">
                Wybierz projekt i prowadź rozmowę z członkami zespołu.
              </p>
            </div>

            <Badge bg="light" text="dark" className="border px-3 py-2">
              Projekty: {projects.length}
            </Badge>
          </div>

          {isLoading ? (
            <div className="text-center py-3">
              <Spinner className="me-2" />
              Ładowanie projektów...
            </div>
          ) : projects.length === 0 ? (
            <Alert variant="secondary" className="mb-0">
              Brak projektów dostępnych dla tego użytkownika.
            </Alert>
          ) : (
            <div className="d-flex gap-2 align-items-center flex-wrap">
              <Form.Select
                style={{ maxWidth: "420px" }}
                value={selectedProjectId}
                onChange={(event) => setSelectedProjectId(event.target.value)}
              >
                <option value="">Wybierz projekt...</option>

                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </Form.Select>

              {selectedProjectId && (
                <Button
                  variant="outline-secondary"
                  onClick={() => setSelectedProjectId("")}
                >
                  Wyczyść wybór
                </Button>
              )}
            </div>
          )}
        </Card.Body>
      </Card>

      {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}

      {selectedProject && (
        <ProjectMessagesSection
          authToken={authToken}
          project={selectedProject}
          authenticatedUser={authenticatedUser}
          canModerateMessages={canModerateMessages}
          onClose={() => setSelectedProjectId("")}
        />
      )}
    </div>
  );
}

export default ChatPage;