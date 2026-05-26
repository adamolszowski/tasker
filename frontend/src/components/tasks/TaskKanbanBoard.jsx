import React from "react";
import Card from "react-bootstrap/Card";
import Button from "react-bootstrap/Button";
import Badge from "react-bootstrap/Badge";
import Form from "react-bootstrap/Form";
import Spinner from "react-bootstrap/Spinner";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";

// komponent do wyswietlania zadan w ukladzie kanban
// kazda kolumna odpowiada jednemu statusowi
function TaskKanbanBoard({
  tasks,
  statuses,
  onEdit,
  onDelete,
  onChangeStatus,
  canEditTask,
  canDeleteTask,
  canChangeStatus,
  onOpenComments,
  statusChangingTaskId,
  deletingTaskId,
}) {
  // grupujemy zadania do kolumn wedlug statusow
  // dla kazdego statusu tworzymy obiekt z jego danymi oraz lista zadan
  const grouped = statuses.map((status) => ({
    ...status,
    tasks: tasks.filter((task) => task.statusId === status.id),
  }));

  return (
    <Row className="g-3">
      {/* przechodzimy po kazdej kolumnie kanbana */}
      {grouped.map((column) => (
        <Col key={column.id} lg={4} md={6}>
          <Card className="border h-100">
            <Card.Body>
              {/* naglowek kolumny: nazwa statusu i liczba zadan */}
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">{column.name}</h5>
                <Badge bg="light" text="dark" className="border">
                  {column.tasks.length}
                </Badge>
              </div>

              <div className="d-flex flex-column gap-3">
                {/* jesli w kolumnie nie ma zadan to pokazujemy komunikat */}
                {column.tasks.length === 0 ? (
                  <div className="text-muted small">Brak zadań w tej kolumnie.</div>
                ) : (
                  // w innym przypadku wyswietlamy karty zadan
                  column.tasks.map((task) => (
                    <Card key={task.id} className="border">
                      <Card.Body>
                        {/* podstawowe informacje o zadaniu */}
                        <div className="fw-semibold mb-1">{task.title}</div>
                        <div className="small text-muted mb-2">{task.projectName}</div>
                        <div className="small mb-2">{task.description || "Brak opisu"}</div>
                        <div className="small mb-2">
                          <strong>Przypisany:</strong> {task.assignedUserName || "Brak przypisania"}
                        </div>
                        <div className="small mb-3">
                          <strong>Termin:</strong> {task.deadline ? String(task.deadline).slice(0, 10) : "-"}
                        </div>

                        {/* priorytet zadania */}
                        <div className="mb-3">
                          <Badge bg="light" text="dark" className="border">
                            {task.priorityName}
                          </Badge>
                        </div>

                        {/* zmiana statusu - tylko dla usera ktory ma do tego uprawnienia */}
                        {canChangeStatus(task) && (
                          <div className="mb-3">
                            <Form.Select
                              value={task.statusId}
                              disabled={statusChangingTaskId === task.id}
                              onChange={(event) =>
                                onChangeStatus(task.id, Number(event.target.value))
                              }
                            >
                              {statuses.map((status) => (
                                <option key={status.id} value={status.id}>
                                  {status.name}
                                </option>
                              ))}
                            </Form.Select>
                          </div>
                        )}

                        {/* przyciski akcji */}
                        <div className="d-flex gap-2 flex-wrap">
                          {/* przycisk edycji tylko jesli user moze edytowac zadanie */}
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={() => onOpenComments(task)}
                          >
                            Komentarze
                          </Button>

                          {canEditTask(task) && (
                            <Button variant="dark" size="sm" onClick={() => onEdit(task)}>
                              Edytuj
                            </Button>
                          )}

                          {/* przycisk usuwania tylko jesli user moze usunac zadanie */}
                          {canDeleteTask(task) && (
                            <Button
                              variant="outline-danger"
                              size="sm"
                              disabled={deletingTaskId === task.id}
                              onClick={() => onDelete(task.id)}
                            >
                              {deletingTaskId === task.id ? (
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
                  ))
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
      ))}
    </Row>
  );
}

export default TaskKanbanBoard;