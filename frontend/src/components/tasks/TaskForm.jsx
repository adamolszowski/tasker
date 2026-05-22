import React, { useEffect, useState } from "react";
import Card from "react-bootstrap/Card";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Alert from "react-bootstrap/Alert";
import Spinner from "react-bootstrap/Spinner";

// formularz do tworzenia i edycji zadania
// przyjmuje dane z rodzica, np. liste projektow, priorytetow i userow do przypisania
function TaskForm({
  mode,
  initialTask,
  projects,
  priorities,
  assignableUsers,
  isAssignableUsersLoading,
  onProjectChange,
  onSubmit,
  onCancel,
  isSubmitting,
}) {
  // id projektu
  const [projectId, setProjectId] = useState("");

  // tytul zadania
  const [title, setTitle] = useState("");

  // opis zadania
  const [description, setDescription] = useState("");

  // termin realizacji
  const [deadline, setDeadline] = useState("");

  // id przypisanego usera
  const [assignedUserId, setAssignedUserId] = useState("");

  // id priorytetu
  const [priorityId, setPriorityId] = useState("");

  // komunikat bledu formularza
  const [errorMessage, setErrorMessage] = useState("");

  // ten useEffect ustawia dane formularza
  // jesli jest tryb edit to wpisujemy dane istniejacego zadania
  // jak nie, to ustawiamy domyslne wartosci do tworzenia nowego zadania
  useEffect(() => {
    if (mode === "edit" && initialTask) {
      setProjectId(String(initialTask.projectId || ""));
      setTitle(initialTask.title || "");
      setDescription(initialTask.description || "");
      setDeadline(initialTask.deadline ? String(initialTask.deadline).slice(0, 10) : "");
      setAssignedUserId(initialTask.assignedUserId ? String(initialTask.assignedUserId) : "");
      setPriorityId(initialTask.priorityId ? String(initialTask.priorityId) : "");
    } else {
      // przy tworzeniu bierzemy pierwszy projekt z listy jako domyslny
      const firstProjectId = projects[0]?.id ? String(projects[0].id) : "";

      // szukamy domyslnego priorytetu "średni"
      const defaultPriorityId = priorities.find((item) => item.name === "średni")?.id;

      setProjectId(firstProjectId);
      setTitle("");
      setDescription("");
      setDeadline("");
      setAssignedUserId("");
      setPriorityId(defaultPriorityId ? String(defaultPriorityId) : "");
    }

    // przy zmianie trybu lub danych czyscimy poprzedni komunikat bledu
    setErrorMessage("");
  }, [mode, initialTask, projects, priorities]);

  // kiedy zmienia sie projekt, informujemy rodzica
  // dzieki temu rodzic moze pobrac userow z tego projektu do przypisania zadania
  useEffect(() => {
    if (!projectId) {
      return;
    }

    onProjectChange(Number(projectId));
  }, [projectId, onProjectChange]);

  // obsluga wysylki formularza
  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");

    // przy tworzeniu projekt jest wymagany
    if (mode !== "edit" && !projectId) {
      setErrorMessage("Projekt jest wymagany.");
      return;
    }

    // tytul nie moze byc pusty
    if (!title.trim()) {
      setErrorMessage("Tytuł zadania jest wymagany.");
      return;
    }

    // tytul nie moze byc za krotki
    if (title.trim().length < 3) {
      setErrorMessage("Tytuł zadania musi mieć co najmniej 3 znaki.");
      return;
    }

    // budujemy obiekt danych do wyslania do backendu
    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      deadline: deadline || null,
      assignedUserId: assignedUserId ? Number(assignedUserId) : null,
      priorityId: priorityId ? Number(priorityId) : null,
    };

    // przy tworzeniu trzeba jeszcze dolozyc id projektu
    if (mode !== "edit") {
      payload.projectId = Number(projectId);
    }

    // wywolujemy funkcje przekazana z rodzica
    await onSubmit(payload);
  };

  return (
    <Card className="mb-4 border">
      <Card.Body>
        <h4 className="mb-3">
          {mode === "edit" ? "Edycja zadania" : "Nowe zadanie"}
        </h4>

        {/* pokazujemy blad formularza jesli taki istnieje */}
        {errorMessage && (
          <Alert variant="danger" className="mb-3">
            {errorMessage}
          </Alert>
        )}

        <Form onSubmit={handleSubmit}>
          {/* wybor projektu pokazujemy tylko przy tworzeniu
              przy edycji projekt zadania juz jest ustalony */}
          {mode !== "edit" && (
            <Form.Group className="mb-3">
              <Form.Label>Projekt</Form.Label>
              <Form.Select
                value={projectId}
                onChange={(event) => setProjectId(event.target.value)}
                disabled={isSubmitting}
              >
                <option value="">Wybierz projekt...</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          )}

          <Form.Group className="mb-3">
            <Form.Label>Tytuł zadania</Form.Label>
            <Form.Control
              type="text"
              placeholder="Wpisz tytuł zadania"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              disabled={isSubmitting}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Opis zadania</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              placeholder="Krótki opis zadania"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              disabled={isSubmitting}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Termin realizacji</Form.Label>
            <Form.Control
              type="date"
              value={deadline}
              onChange={(event) => setDeadline(event.target.value)}
              disabled={isSubmitting}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Priorytet</Form.Label>
            <Form.Select
              value={priorityId}
              onChange={(event) => setPriorityId(event.target.value)}
              disabled={isSubmitting}
            >
              <option value="">Wybierz priorytet...</option>
              {priorities.map((priority) => (
                <option key={priority.id} value={priority.id}>
                  {priority.name}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-4">
            <Form.Label>Przypisany użytkownik</Form.Label>
            <Form.Select
              value={assignedUserId}
              onChange={(event) => setAssignedUserId(event.target.value)}
              disabled={isSubmitting || isAssignableUsersLoading || !projectId}
            >
              <option value="">Brak przypisania</option>
              {assignableUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {`${user.first_name || ""} ${user.last_name || ""}`.trim()} - {user.role_name}
                </option>
              ))}
            </Form.Select>

            {/* komunikat kiedy trwa pobieranie userow projektu */}
            {isAssignableUsersLoading && (
              <div className="small text-muted mt-2">Ładowanie użytkowników projektu...</div>
            )}
          </Form.Group>

          <div className="d-flex gap-2">
            <Button type="submit" variant="dark" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Spinner size="sm" className="me-2" />
                  Zapisywanie...
                </>
              ) : mode === "edit" ? (
                "Zapisz zmiany"
              ) : (
                "Utwórz zadanie"
              )}
            </Button>

            <Button
              type="button"
              variant="outline-secondary"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Anuluj
            </Button>
          </div>
        </Form>
      </Card.Body>
    </Card>
  );
}

export default TaskForm;