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

// glowny widok modulu zadan
// tutaj trzymamy liste zadan, filtry, formularz oraz obsluge akcji typu edycja, usuwanie i zmiana statusu
function TasksPage({ authToken, authenticatedUser }) {
  // lista zadan
  const [tasks, setTasks] = useState([]);

  // lista statusow zadan
  const [statuses, setStatuses] = useState([]);

  // lista priorytetow
  const [priorities, setPriorities] = useState([]);

  // lista projektow dostepnych dla usera
  const [projects, setProjects] = useState([]);

  // userzy ktorych mozna przypisac do zadania w wybranym projekcie
  const [assignableUsers, setAssignableUsers] = useState([]);

  // tryb widoku: lista albo kanban
  const [viewMode, setViewMode] = useState("list");

  // tekst wpisany w wyszukiwarce
  const [searchTerm, setSearchTerm] = useState("");

  // aktualnie wybrany filtr projektu
  const [selectedProjectId, setSelectedProjectId] = useState("");

  // aktualnie wybrany filtr statusu
  const [selectedStatusId, setSelectedStatusId] = useState("");

  // aktualnie wybrany filtr priorytetu
  const [selectedPriorityId, setSelectedPriorityId] = useState("");

  // flaga ladowania calego widoku
  const [isLoading, setIsLoading] = useState(true);

  // flaga zapisywania formularza
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);

  // flaga ladowania userow projektu do przypisania
  const [isAssignableUsersLoading, setIsAssignableUsersLoading] = useState(false);

  // id zadania ktoremu wlasnie zmieniamy status
  const [statusChangingTaskId, setStatusChangingTaskId] = useState(null);

  // id zadania ktore wlasnie usuwamy
  const [deletingTaskId, setDeletingTaskId] = useState(null);

  // tryb formularza: create albo edit
  const [formMode, setFormMode] = useState(null);

  // zadanie ktore aktualnie edytujemy
  const [editingTask, setEditingTask] = useState(null);

  // komunikat bledu
  const [errorMessage, setErrorMessage] = useState("");

  // komunikat sukcesu
  const [successMessage, setSuccessMessage] = useState("");

  // sprawdzamy czy user jest administratorem albo superadminem
  const isAdminLike =
    authenticatedUser?.role === "administrator" ||
    authenticatedUser?.role === "superadmin";

  // tylko kierownik oraz admin/superadmin moga tworzyc zadania
  const canCreate = authenticatedUser?.role === "kierownik" || isAdminLike;

  // tworzymy zbior id projektow ktore naleza do zalogowanego usera
  // useMemo zeby nie liczyc tego na nowo bez potrzeby przy kazdym renderze
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

  // pomocnicza funkcja do czyszczenia komunikatow
  const resetMessages = () => {
    setErrorMessage("");
    setSuccessMessage("");
  };

  // pobieramy zadania z backendu na podstawie aktualnych filtrow
  const loadTasks = async () => {
    const data = await getTasks(authToken, {
      projectId: selectedProjectId || null,
      statusId: selectedStatusId || null,
      priorityId: selectedPriorityId || null,
    });

    setTasks(data.tasks || []);
  };

  // pobieramy slowniki potrzebne do modulu zadan:
  // statusy, priorytety i projekty
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

  // ladowanie danych po wejsciu na widok
  // robimy to po zalogowaniu i gdy zmieni sie user albo token
  useEffect(() => {
    const loadData = async () => {
      if (!authenticatedUser || !authToken) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        resetMessages();

        // pobieramy slowniki i zadania rownoczesnie
        await Promise.all([loadDictionaries(), loadTasks()]);
      } catch (error) {
        setErrorMessage(error.message || "Nie udało się pobrać zadań.");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [authToken, authenticatedUser?.id]);

  // przeladowanie listy zadan po zmianie filtrow
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

  // dodatkowe filtrowanie po tekscie wpisanym w wyszukiwarce
  // useMemo zeby nie przeliczac tego niepotrzebnie
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

  // otwieramy formularz tworzenia zadania
  const openCreateForm = () => {
    resetMessages();
    setFormMode("create");
    setEditingTask(null);
    setAssignableUsers([]);
  };

  // otwieramy formularz edycji zadania
  // dodatkowo pobieramy userow z projektu tego zadania, zeby bylo mozna kogos przypisac
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

  // zamykamy formularz i czyscimy dane pomocnicze
  const closeForm = () => {
    setFormMode(null);
    setEditingTask(null);
    setAssignableUsers([]);
  };

  // ta funkcja uruchamia sie gdy w formularzu zmieni sie projekt
  // pobieramy wtedy userow z tego projektu, ktorych mozna przypisac do zadania
  // useCallback zeby funkcja nie dostawala nowej referencji przy kazdym renderze
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

  // obsluga wysylki formularza tworzenia/edycji
  const handleFormSubmit = async (payload) => {
    try {
      setIsFormSubmitting(true);
      resetMessages();

      // jesli jest tryb edit to aktualizujemy istniejace zadanie
      if (formMode === "edit" && editingTask) {
        const data = await updateTask(authToken, editingTask.id, payload);

        // podmieniamy tylko to jedno zadanie w stanie
        setTasks((prev) =>
          prev.map((task) => (task.id === editingTask.id ? data.task : task))
        );
        setSuccessMessage(data.message || "Zadanie zostało zaktualizowane.");
      } else {
        // w innym przypadku tworzymy nowe zadanie
        const data = await createTask(authToken, payload);

        // nowe zadanie wrzucamy na poczatek listy
        setTasks((prev) => [data.task, ...prev]);
        setSuccessMessage(data.message || "Zadanie zostało utworzone.");
      }

      closeForm();

      // po zapisie jeszcze raz pobieramy zadania z backendu, zeby miec pewne aktualne dane
      await loadTasks();
    } catch (error) {
      setErrorMessage(error.message || "Nie udało się zapisać zadania.");
    } finally {
      setIsFormSubmitting(false);
    }
  };

  // usuwanie zadania
  const handleDeleteTask = async (taskId) => {
    try {
      setDeletingTaskId(taskId);
      resetMessages();

      const data = await deleteTask(authToken, taskId);

      // usuwamy zadanie z lokalnej listy
      setTasks((prev) => prev.filter((task) => task.id !== taskId));
      setSuccessMessage(data.message || "Zadanie zostało usunięte.");
    } catch (error) {
      setErrorMessage(error.message || "Nie udało się usunąć zadania.");
    } finally {
      setDeletingTaskId(null);
    }
  };

  // zmiana statusu zadania
  const handleChangeStatus = async (taskId, statusId) => {
    try {
      setStatusChangingTaskId(taskId);
      resetMessages();

      const data = await changeTaskStatus(authToken, taskId, { statusId });

      // podmieniamy tylko zadanie ktoremu zmieniono status
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

  // sprawdzamy czy user moze edytowac dane zadanie
  const canEditTask = (task) => {
    if (!authenticatedUser || !task) {
      return false;
    }

    if (isAdminLike) {
      return true;
    }

    return authenticatedUser.role === "kierownik" && ownedProjectIds.has(task.projectId);
  };

  // logika usuwania jest taka sama jak dla edycji
  const canDeleteTask = (task) => canEditTask(task);

  // sprawdzamy czy user moze zmienic status zadania
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

  // jesli nie ma zalogowanego usera to pokazujemy komunikat
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

            {/* przycisk tworzenia zadania widza tylko role ktore moga tworzyc */}
            {canCreate && (
              <Button variant="dark" onClick={openCreateForm}>
                Nowe zadanie
              </Button>
            )}
          </div>

          {/* filtry i przelacznik widoku */}
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

      {/* komunikaty bledu i sukcesu */}
      {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
      {successMessage && <Alert variant="success">{successMessage}</Alert>}

      {/* formularz pokazujemy tylko kiedy jest aktywny tryb create albo edit */}
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

      {/* stan ladowania */}
      {isLoading ? (
        <Card className="border">
          <Card.Body className="text-center py-4">
            <Spinner className="me-2" />
            Ładowanie zadań...
          </Card.Body>
        </Card>
      ) : filteredTasks.length === 0 ? (
        // jesli nie ma zadnych zadan po filtrowaniu
        <Alert variant="secondary">Brak zadań do wyświetlenia.</Alert>
      ) : viewMode === "list" ? (
        // widok listy
        <Card className="border">
          <Card.Body className="p-0">
            <TaskListTable
              tasks={filteredTasks}
              statuses={statuses}
              onEdit={openEditForm}
              onDelete={handleDeleteTask}
              onChangeStatus={handleChangeStatus}
              canEditTask={canEditTask}
              canDeleteTask={canDeleteTask}
              canChangeStatus={canChangeStatus}
              statusChangingTaskId={statusChangingTaskId}
              deletingTaskId={deletingTaskId}
            />
          </Card.Body>
        </Card>
      ) : (
        // widok kanban
        <TaskKanbanBoard
          tasks={filteredTasks}
          statuses={statuses}
          onEdit={openEditForm}
          onDelete={handleDeleteTask}
          onChangeStatus={handleChangeStatus}
          canEditTask={canEditTask}
          canDeleteTask={canDeleteTask}
          canChangeStatus={canChangeStatus}
          statusChangingTaskId={statusChangingTaskId}
          deletingTaskId={deletingTaskId}
        />
      )}
    </div>
  );
}

export default TasksPage;