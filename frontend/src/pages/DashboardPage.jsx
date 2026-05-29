import React, { useEffect, useMemo, useState } from "react";
import Alert from "react-bootstrap/Alert";
import Badge from "react-bootstrap/Badge";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import Spinner from "react-bootstrap/Spinner";
import Table from "react-bootstrap/Table";
import { getProjects, getUsersDirectory } from "../api/projectsApi";
import { getTasks } from "../api/tasksApi";

function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

function formatDate(value) {
  if (!value) {
    return "Brak terminu";
  }

  return new Date(value).toLocaleDateString("pl-PL");
}

function getProjectStatus(project) {
  return project.statusName || project.status_name || "";
}

function getProjectOwner(project) {
  const fullName = `${project.owner_first_name || ""} ${
    project.owner_last_name || ""
  }`.trim();

  return fullName || "Brak danych";
}

function getTaskProjectId(task) {
  return task.projectId || task.project_id;
}

function getTaskStatus(task) {
  return task.statusName || task.status_name || "";
}

function getTaskPriority(task) {
  return task.priorityName || task.priority_name || "";
}

function getTaskAssignedUserId(task) {
  return task.assignedUserId || task.assigned_user_id;
}

function DashboardStatCard({ title, value, description }) {
  return (
    <Card className="border h-100">
      <Card.Body>
        <p className="text-muted mb-2">{title}</p>
        <h2 className="mb-2">{value}</h2>
        <p className="text-muted mb-0 small">{description}</p>
      </Card.Body>
    </Card>
  );
}

function DashboardPage({ authToken, authenticatedUser, onNavigate }) {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!authToken || !authenticatedUser) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setErrorMessage("");

        const [projectsData, tasksData, usersData] = await Promise.all([
          getProjects(authToken),
          getTasks(authToken),
          getUsersDirectory(authToken),
        ]);

        setProjects(projectsData.projects || []);
        setTasks(tasksData.tasks || []);
        setUsers(usersData.users || []);
      } catch (error) {
        setErrorMessage(
          error.message || "Nie udało się pobrać danych dashboardu."
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [authToken, authenticatedUser?.id]);

  const activeProjects = useMemo(() => {
    return projects.filter((project) => {
      const status = normalizeText(getProjectStatus(project));

      return status !== "usuniety" && status !== "usunięty";
    });
  }, [projects]);

  const todoTasks = useMemo(() => {
    return tasks.filter(
      (task) => normalizeText(getTaskStatus(task)) === "do zrobienia"
    );
  }, [tasks]);

  const doneTasks = useMemo(() => {
    return tasks.filter(
      (task) => normalizeText(getTaskStatus(task)) === "zrobione"
    );
  }, [tasks]);

  const latestProjects = useMemo(() => {
    return [...activeProjects]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 5);
  }, [activeProjects]);

  const myTasks = useMemo(() => {
    if (!authenticatedUser?.id) {
      return [];
    }

    return tasks
      .filter(
        (task) =>
          Number(getTaskAssignedUserId(task)) === Number(authenticatedUser.id)
      )
      .sort((a, b) => {
        if (!a.deadline && !b.deadline) {
          return 0;
        }

        if (!a.deadline) {
          return 1;
        }

        if (!b.deadline) {
          return -1;
        }

        return new Date(a.deadline) - new Date(b.deadline);
      })
      .slice(0, 5);
  }, [tasks, authenticatedUser?.id]);

  const getProjectTasksCount = (projectId) => {
    return tasks.filter(
      (task) => Number(getTaskProjectId(task)) === Number(projectId)
    ).length;
  };

  if (!authenticatedUser) {
    return (
      <Alert variant="warning">
        Musisz być zalogowany, aby zobaczyć dashboard.
      </Alert>
    );
  }

  return (
    <div>
      <Card className="mb-4 border">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-start gap-3">
            <div>
              <h2 className="mb-1">PRZEGLĄD</h2>
              <p className="text-muted mb-0">
                Panel startowy z najważniejszymi informacjami o projektach,
                zadaniach i użytkownikach.
              </p>
            </div>
          </div>
        </Card.Body>
      </Card>

      {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}

      {isLoading ? (
        <Card className="border">
          <Card.Body className="text-center py-4">
            <Spinner className="me-2" />
            Ładowanie danych dashboardu...
          </Card.Body>
        </Card>
      ) : (
        <>
          <Row className="g-3 mb-4">
            <Col md={6} xl={3}>
              <DashboardStatCard
                title="Aktywne projekty"
                value={activeProjects.length}
                description="Projekty dostępne dla użytkownika"
              />
            </Col>

            <Col md={6} xl={3}>
              <DashboardStatCard
                title="Zadania do wykonania"
                value={todoTasks.length}
                description="Zadania ze statusem Do zrobienia"
              />
            </Col>

            <Col md={6} xl={3}>
              <DashboardStatCard
                title="Ukończone zadania"
                value={doneTasks.length}
                description="Zadania ze statusem Zrobione"
              />
            </Col>

            <Col md={6} xl={3}>
              <DashboardStatCard
                title="Aktywni użytkownicy"
                value={users.length}
                description="Użytkownicy z przypisaną rolą"
              />
            </Col>
          </Row>

          <Row className="g-4">
            <Col lg={6}>
              <Card className="border h-100">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <div>
                      <h5 className="mb-1">Ostatnie projekty</h5>
                      <p className="text-muted mb-0 small">
                        Najnowsze projekty dostępne dla zalogowanego użytkownika.
                      </p>
                    </div>

                    <Button
                      variant="outline-dark"
                      size="sm"
                      onClick={() => onNavigate && onNavigate("projects")}
                    >
                      Projekty
                    </Button>
                  </div>

                  {latestProjects.length === 0 ? (
                    <Alert variant="secondary" className="mb-0">
                      Brak projektów do wyświetlenia.
                    </Alert>
                  ) : (
                    <Table responsive hover className="mb-0 align-middle">
                      <thead>
                        <tr>
                          <th>Nazwa</th>
                          <th>Status</th>
                          <th>Zadania</th>
                          <th>Autor</th>
                        </tr>
                      </thead>
                      <tbody>
                        {latestProjects.map((project) => (
                          <tr key={project.id}>
                            <td>{project.name}</td>
                            <td>
                              <Badge bg="light" text="dark" className="border">
                                {getProjectStatus(project)}
                              </Badge>
                            </td>
                            <td>{getProjectTasksCount(project.id)}</td>
                            <td>{getProjectOwner(project)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  )}
                </Card.Body>
              </Card>
            </Col>

            <Col lg={6}>
              <Card className="border h-100">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <div>
                      <h5 className="mb-1">Zadania przypisane do mnie</h5>
                      <p className="text-muted mb-0 small">
                        Najbliższe zadania przypisane do zalogowanego użytkownika.
                      </p>
                    </div>

                    <Button
                      variant="outline-dark"
                      size="sm"
                      onClick={() => onNavigate && onNavigate("tasks")}
                    >
                      Zadania
                    </Button>
                  </div>

                  {myTasks.length === 0 ? (
                    <Alert variant="secondary" className="mb-0">
                      Brak zadań przypisanych do zalogowanego użytkownika.
                    </Alert>
                  ) : (
                    <Table responsive hover className="mb-0 align-middle">
                      <thead>
                        <tr>
                          <th>Zadanie</th>
                          <th>Projekt</th>
                          <th>Status</th>
                          <th>Priorytet</th>
                          <th>Termin</th>
                        </tr>
                      </thead>
                      <tbody>
                        {myTasks.map((task) => (
                          <tr key={task.id}>
                            <td>{task.title}</td>
                            <td>{task.projectName || "-"}</td>
                            <td>
                              <Badge bg="light" text="dark" className="border">
                                {getTaskStatus(task)}
                              </Badge>
                            </td>
                            <td>{getTaskPriority(task) || "-"}</td>
                            <td>{formatDate(task.deadline)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      )}
    </div>
  );
}

export default DashboardPage;