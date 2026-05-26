import React, { useCallback, useEffect, useMemo, useState } from "react";
import Card from "react-bootstrap/Card";
import Alert from "react-bootstrap/Alert";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Spinner from "react-bootstrap/Spinner";
import Stack from "react-bootstrap/Stack";
import TaskForm from "../components/tasks/TaskForm";
import TaskListTable from "../components/tasks/TaskListTable";
import TaskKanbanBoard from "../components/tasks/TaskKanbanBoard";
import TaskCommentsSection from "../components/comments/TaskCommentsSection";
import {
  getTasks,
  getTaskStatuses,
  getTaskPriorities,
  getProjects,
  getAssignableUsers,
  createTask,
  updateTask,
  deleteTask,
  changeTaskStatus,
} from "../api/tasksApi";

function TasksPage({ authToken, authenticatedUser }) {
  const [tasks, setTasks] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [projects, setProjects] = useState([]);
  const [assignableUsers, setAssignableUsers] = useState([]);
  const [viewMode, setViewMode] = useState("list");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedStatusId, setSelectedStatusId] = useState("");
  const [selectedPriorityId, setSelectedPriorityId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);
  const [isAssignableUsersLoading, setIsAssignableUsersLoading] = useState(false);
  const [statusChangingTaskId, setStatusChangingTaskId] = useState(null);
  const [deletingTaskId, setDeletingTaskId] = useState(null);
  const [formMode, setFormMode] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [selectedTaskForComments, setSelectedTaskForComments] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const isAdminLike =
    authenticatedUser?.role === "administrator" ||
    authenticatedUser?.role === "superadmin";

  const canCreate = authenticatedUser?.role === "kierownik" || isAdminLike;

  const ownedProjectIds = useMemo(() => {
    if (!authenticatedUser) {
      return new Set();
    }

    return new Set(
      projects
        .filter((project) => project.created_by_user_id === authenticatedUser.id)
        .map((project) => project.id)
    );
  }, [projects, authenticatedUser]);

  const resetMessages = () => {
    setErrorMessage("");
    setSuccessMessage("");
  };

  const loadTasks = async () => {
    const data = await getTasks(authToken, {
      projectId: selectedProjectId || null,
      statusId: selectedStatusId || null,
      priorityId: selectedPriorityId || null,
    });

    setTasks(data.tasks || []);
  };

  const loadDictionaries = async () => {
    const [statusesData, prioritiesData, projectsData] = await Promise.all([
      getTaskStatuses(authToken),
      getTaskPriorities(authToken),
      getProjects(authToken),
    ]);

    setStatuses(statusesData.statuses || []);
    setPriorities(prioritiesData.priorities || []);
    setProjects(projectsData.projects || []);
  };

  useEffect(() => {
    const loadData = async () => {
      if (!authenticatedUser || !authToken) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        resetMessages();
        await Promise.all([loadDictionaries(), loadTasks()]);
      } catch (error) {
        setErrorMessage(error.message || "Nie udało się pobrać zadań.");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [authToken, authenticatedUser?.id]);

  useEffect(() => {
    const reload = async () => {
      if (!authenticatedUser || !authToken) {
        return;
      }

      try {
        setIsLoading(true);
        await loadTasks();
      } catch (error) {
        setErrorMessage(error.message || "Nie udało się pobrać zadań.");
      } finally {
        setIsLoading(false);
      }
    };

    reload();
  }, [selectedProjectId, selectedStatusId, selectedPriorityId]);

  useEffect(() => {
    if (!selectedTaskForComments) {
      return;
    }

    const freshTask = tasks.find((task) => task.id === selectedTaskForComments.id);

    if (!freshTask) {
      setSelectedTaskForComments(null);
      return;
    }

    if (freshTask !== selectedTaskForComments) {
      setSelectedTaskForComments(freshTask);
    }
  }, [tasks, selectedTaskForComments]);

  const filteredTasks = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) {
      return tasks;
    }

    return tasks.filter((task) => {
      return (
        task.title.toLowerCase().includes(query) ||
        (task.description || "").toLowerCase().includes(query) ||
        (task.projectName || "").toLowerCase().includes(query) ||
        (task.assignedUserName || "").toLowerCase().includes(query) ||
        (task.statusName || "").toLowerCase().includes(query) ||
        (task.priorityName || "").toLowerCase().includes(query)
      );
    });
  }, [tasks, searchTerm]);

  const openCreateForm = () => {
    resetMessages();
    setFormMode("create");
    setEditingTask(null);
    setAssignableUsers([]);
  };

  const openEditForm = async (task) => {
    resetMessages();
    setFormMode("edit");
    setEditingTask(task);

    try {
      setIsAssignableUsersLoading(true);
      const data = await getAssignableUsers(authToken, task.projectId);
      setAssignableUsers(data.users || []);
    } catch (error) {
      setErrorMessage(error.message || "Nie udało się pobrać użytkowników projektu.");
      setAssignableUsers([]);
    } finally {
      setIsAssignableUsersLoading(false);
    }
  };

  const closeForm = () => {
    setFormMode(null);
    setEditingTask(null);
    setAssignableUsers([]);
  };

  const openCommentsPanel = (task) => {
    resetMessages();
    setSelectedTaskForComments(task);
  };

  const closeCommentsPanel = () => {
    setSelectedTaskForComments(null);
  };

  const handleProjectChangeForForm = useCallback(async (projectId) => {
    if (!projectId) {
      setAssignableUsers([]);
      return;
    }

    try {
      setIsAssignableUsersLoading(true);
      const data = await getAssignableUsers(authToken, projectId);
      setAssignableUsers(data.users || []);
    } catch (error) {
      setErrorMessage(error.message || "Nie udało się pobrać użytkowników projektu.");
      setAssignableUsers([]);
    } finally {
      setIsAssignableUsersLoading(false);
    }
  }, [authToken]);

  const handleFormSubmit = async (payload) => {
    try {
      setIsFormSubmitting(true);
      resetMessages();

      if (formMode === "edit" && editingTask) {
        const data = await updateTask(authToken, editingTask.id, payload);
        setTasks((prev) =>
          prev.map((task) => (task.id === editingTask.id ? data.task : task))
        );
        setSuccessMessage(data.message || "Zadanie zostało zaktualizowane.");
      } else {
        const data = await createTask(authToken, payload);
        setTasks((prev) => [data.task, ...prev]);
        setSuccessMessage(data.message || "Zadanie zostało utworzone.");
      }

      closeForm();
      await loadTasks();
    } catch (error) {
      setErrorMessage(error.message || "Nie udało się zapisać zadania.");
    } finally {
      setIsFormSubmitting(false);
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      setDeletingTaskId(taskId);
      resetMessages();

      const data = await deleteTask(authToken, taskId);
      setTasks((prev) => prev.filter((task) => task.id !== taskId));
      setSuccessMessage(data.message || "Zadanie zostało usunięte.");

      if (selectedTaskForComments?.id === taskId) {
        setSelectedTaskForComments(null);
      }
    } catch (error) {
      setErrorMessage(error.message || "Nie udało się usunąć zadania.");
    } finally {
      setDeletingTaskId(null);
    }
  };

  const handleChangeStatus = async (taskId, statusId) => {
    try {
      setStatusChangingTaskId(taskId);
      resetMessages();

      const data = await changeTaskStatus(authToken, taskId, { statusId });
      setTasks((prev) =>
        prev.map((task) => (task.id === taskId ? data.task : task))
      );
      setSuccessMessage(data.message || "Status zadania został zmieniony.");
    } catch (error) {
      setErrorMessage(error.message || "Nie udało się zmienić statusu zadania.");
    } finally {
      setStatusChangingTaskId(null);
    }
  };

  const canEditTask = (task) => {
    if (!authenticatedUser || !task) {
      return false;
    }

    if (isAdminLike) {
      return true;
    }

    return authenticatedUser.role === "kierownik" && ownedProjectIds.has(task.projectId);
  };

  const canDeleteTask = (task) => canEditTask(task);

  const canChangeStatus = (task) => {
    if (!authenticatedUser || !task) {
      return false;
    }

    if (isAdminLike) {
      return true;
    }

    if (authenticatedUser.role === "kierownik") {
      return ownedProjectIds.has(task.projectId);
    }

    if (authenticatedUser.role === "pracownik") {
      return task.assignedUserId === authenticatedUser.id;
    }

    return false;
  };

  const canModerateComments = selectedTaskForComments
    ? isAdminLike ||
      (authenticatedUser?.role === "kierownik" &&
        ownedProjectIds.has(selectedTaskForComments.projectId))
    : false;

  if (!authenticatedUser) {
    return (
      <Alert variant="warning">
        Musisz być zalogowany, aby zobaczyć zadania.
      </Alert>
    );
  }

  return (
    <div>
      <Card className="mb-4 border">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
            <div>
              <h2 className="mb-1">ZADANIA</h2>
              <p className="text-muted mb-0">
                Lista i kanban zadań dostępnych dla zalogowanego użytkownika
              </p>
            </div>

            {canCreate && (
              <Button variant="dark" onClick={openCreateForm}>
                Nowe zadanie
              </Button>
            )}
          </div>

          <Stack direction="horizontal" gap={2} className="flex-wrap">
            <Form.Control
              style={{ maxWidth: "260px" }}
              type="text"
              placeholder="Szukaj zadania..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />

            <Form.Select
              style={{ maxWidth: "220px" }}
              value={selectedProjectId}
              onChange={(event) => setSelectedProjectId(event.target.value)}
            >
              <option value="">Wszystkie projekty</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </Form.Select>

            <Form.Select
              style={{ maxWidth: "200px" }}
              value={selectedStatusId}
              onChange={(event) => setSelectedStatusId(event.target.value)}
            >
              <option value="">Wszystkie statusy</option>
              {statuses.map((status) => (
                <option key={status.id} value={status.id}>
                  {status.name}
                </option>
              ))}
            </Form.Select>

            <Form.Select
              style={{ maxWidth: "200px" }}
              value={selectedPriorityId}
              onChange={(event) => setSelectedPriorityId(event.target.value)}
            >
              <option value="">Wszystkie priorytety</option>
              {priorities.map((priority) => (
                <option key={priority.id} value={priority.id}>
                  {priority.name}
                </option>
              ))}
            </Form.Select>

            <Button
              variant={viewMode === "list" ? "dark" : "outline-dark"}
              onClick={() => setViewMode("list")}
            >
              Lista
            </Button>
            <Button
              variant={viewMode === "kanban" ? "dark" : "outline-dark"}
              onClick={() => setViewMode("kanban")}
            >
              Kanban
            </Button>
          </Stack>
        </Card.Body>
      </Card>

      {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
      {successMessage && <Alert variant="success">{successMessage}</Alert>}

      {formMode && (
        <TaskForm
          mode={formMode}
          initialTask={editingTask}
          projects={projects}
          priorities={priorities}
          assignableUsers={assignableUsers}
          isAssignableUsersLoading={isAssignableUsersLoading}
          onProjectChange={handleProjectChangeForForm}
          onSubmit={handleFormSubmit}
          onCancel={closeForm}
          isSubmitting={isFormSubmitting}
        />
      )}

      {isLoading ? (
        <Card className="border">
          <Card.Body className="text-center py-4">
            <Spinner className="me-2" />
            Ładowanie zadań...
          </Card.Body>
        </Card>
      ) : filteredTasks.length === 0 ? (
        <Alert variant="secondary">Brak zadań do wyświetlenia.</Alert>
      ) : viewMode === "list" ? (
        <Card className="border">
          <Card.Body className="p-0">
            <TaskListTable
              tasks={filteredTasks}
              statuses={statuses}
              onEdit={openEditForm}
              onDelete={handleDeleteTask}
              onChangeStatus={handleChangeStatus}
              onOpenComments={openCommentsPanel}
              canEditTask={canEditTask}
              canDeleteTask={canDeleteTask}
              canChangeStatus={canChangeStatus}
              statusChangingTaskId={statusChangingTaskId}
              deletingTaskId={deletingTaskId}
            />
          </Card.Body>
        </Card>
      ) : (
        <TaskKanbanBoard
          tasks={filteredTasks}
          statuses={statuses}
          onEdit={openEditForm}
          onDelete={handleDeleteTask}
          onChangeStatus={handleChangeStatus}
          onOpenComments={openCommentsPanel}
          canEditTask={canEditTask}
          canDeleteTask={canDeleteTask}
          canChangeStatus={canChangeStatus}
          statusChangingTaskId={statusChangingTaskId}
          deletingTaskId={deletingTaskId}
        />
      )}

      {selectedTaskForComments && (
        <TaskCommentsSection
          authToken={authToken}
          task={selectedTaskForComments}
          authenticatedUser={authenticatedUser}
          canModerateComments={canModerateComments}
          onClose={closeCommentsPanel}
        />
      )}
    </div>
  );
}

export default TasksPage;
