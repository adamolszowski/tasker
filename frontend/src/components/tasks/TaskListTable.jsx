import React, { useEffect, useState } from "react";
import Table from "react-bootstrap/Table";
import Button from "react-bootstrap/Button";
import Badge from "react-bootstrap/Badge";
import Form from "react-bootstrap/Form";
import Spinner from "react-bootstrap/Spinner";

// komponent do wyswietlania zadan w formie tabeli
function TaskListTable({
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
  // tutaj trzymamy tymczasowo wybrane statusy w selectach
  // dzieki temu user moze wybrac nowy status zanim kliknie przycisk "Zmień"
  const [statusDrafts, setStatusDrafts] = useState({});

  // kiedy lista zadan sie zmieni, ustawiamy drafty statusow od nowa
  // dla kazdego zadania zapisujemy jego aktualny status
  useEffect(() => {
    const nextDrafts = {};
    tasks.forEach((task) => {
      nextDrafts[task.id] = task.statusId;
    });
    setStatusDrafts(nextDrafts);
  }, [tasks]);

  return (
    <Table responsive hover className="mb-0 align-middle">
      <thead>
        <tr>
          <th>Tytuł</th>
          <th>Projekt</th>
          <th>Przypisany</th>
          <th>Status</th>
          <th>Priorytet</th>
          <th>Termin</th>
          <th>Akcje</th>
        </tr>
      </thead>

      <tbody>
        {/* przechodzimy po wszystkich zadaniach i tworzymy kolejne wiersze tabeli */}
        {tasks.map((task) => {
          // sprawdzamy jakie akcje sa dostepne dla tego usera przy tym zadaniu
          const canEdit = canEditTask(task);
          const canDelete = canDeleteTask(task);
          const canStatus = canChangeStatus(task);

          return (
            <tr key={task.id}>
              <td>
                {/* tytul i opis zadania */}
                <div className="fw-semibold">{task.title}</div>
                <div className="small text-muted">
                  {task.description || "Brak opisu"}
                </div>
              </td>

              {/* nazwa projektu */}
              <td>{task.projectName}</td>

              {/* przypisany user albo informacja ze nikt nie jest przypisany */}
              <td>{task.assignedUserName || "Brak przypisania"}</td>

              <td style={{ minWidth: "220px" }}>
                {/* jesli user moze zmieniac status to pokazujemy select i przycisk */}
                {canStatus ? (
                  <div className="d-flex gap-2">
                    <Form.Select
                      value={statusDrafts[task.id] || task.statusId}
                      onChange={(event) =>
                        setStatusDrafts((prev) => ({
                          ...prev,
                          [task.id]: Number(event.target.value),
                        }))
                      }
                      disabled={statusChangingTaskId === task.id}
                    >
                      {statuses.map((status) => (
                        <option key={status.id} value={status.id}>
                          {status.name}
                        </option>
                      ))}
                    </Form.Select>

                    <Button
                      variant="outline-dark"
                      disabled={
                        // blokujemy przycisk gdy status jest w trakcie zmiany
                        // albo gdy nowy status jest taki sam jak obecny
                        statusChangingTaskId === task.id ||
                        Number(statusDrafts[task.id] || task.statusId) === task.statusId
                      }
                      onClick={() =>
                        onChangeStatus(
                          task.id,
                          Number(statusDrafts[task.id] || task.statusId)
                        )
                      }
                    >
                      {statusChangingTaskId === task.id ? (
                        <>
                          <Spinner size="sm" className="me-2" />
                          Zmiana...
                        </>
                      ) : (
                        "Zmień"
                      )}
                    </Button>
                  </div>
                ) : (
                  // jesli user nie moze zmieniac statusu to pokazujemy tylko badge
                  <Badge bg="light" text="dark" className="border">
                    {task.statusName}
                  </Badge>
                )}
              </td>

              {/* priorytet zadania */}
              <td>
                <Badge bg="light" text="dark" className="border">
                  {task.priorityName}
                </Badge>
              </td>

              {/* termin albo myslnik jesli brak */}
              <td>{task.deadline ? String(task.deadline).slice(0, 10) : "-"}</td>

              <td>
                <div className="d-flex gap-2 flex-wrap">
                  {/* przycisk edycji tylko jesli user ma do niej uprawnienia */}
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => onOpenComments(task)}
                  >
                    Komentarze
                  </Button>

                  {canEdit && (
                    <Button
                      variant="dark"
                      size="sm"
                      onClick={() => onEdit(task)}
                    >
                      Edytuj
                    </Button>
                  )}

                  {/* przycisk usuwania tylko jesli user ma do tego prawo */}
                  {canDelete && (
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
              </td>
            </tr>
          );
        })}
      </tbody>
    </Table>
  );
}

export default TaskListTable;