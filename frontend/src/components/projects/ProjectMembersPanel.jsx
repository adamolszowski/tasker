import React, { useMemo, useState } from "react";
import Card from "react-bootstrap/Card";
import Alert from "react-bootstrap/Alert";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Table from "react-bootstrap/Table";
import Spinner from "react-bootstrap/Spinner";
import Badge from "react-bootstrap/Badge";

function getFullName(user) {
  return `${user.first_name || ""} ${user.last_name || ""}`.trim() || "Brak danych";
}

function getRoleLabel(roleName) {
  switch (roleName) {
    case "pracownik":
      return "Pracownik";
    case "kierownik":
      return "Kierownik";
    case "administrator":
      return "Administrator";
    case "superadmin":
      return "Superadministrator";
    default:
      return "Brak roli";
  }
}

function ProjectMembersPanel({
  project,
  members,
  allUsers,
  canManage,
  isLoading,
  isAdding,
  removingUserId,
  onAddMember,
  onRemoveMember,
  onClose,
}) {
  const [selectedUserId, setSelectedUserId] = useState("");

  const availableUsers = useMemo(() => {
    const memberIds = new Set(members.map((member) => member.user_id));
    return allUsers.filter((user) => !memberIds.has(user.id));
  }, [allUsers, members]);

  const handleAdd = async () => {
    if (!selectedUserId) {
      return;
    }

    await onAddMember(Number(selectedUserId));
    setSelectedUserId("");
  };

  return (
    <Card className="mt-4 border">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
          <div>
            <h4 className="mb-1">Członkowie projektu</h4>
            <p className="text-muted mb-0">{project.name}</p>
          </div>

          <Button variant="outline-secondary" onClick={onClose}>
            Zamknij
          </Button>
        </div>

        {canManage && (
          <div className="border rounded p-3 mb-4">
            <h6 className="mb-3">Dodaj użytkownika do projektu</h6>
            {availableUsers.length === 0 ? (
              <Alert variant="secondary" className="mb-0">
                Brak dostępnych użytkowników do dodania.
              </Alert>
            ) : (
              <div className="d-flex gap-2">
                <Form.Select
                  value={selectedUserId}
                  onChange={(event) => setSelectedUserId(event.target.value)}
                  disabled={isAdding}
                >
                  <option value="">Wybierz użytkownika...</option>
                  {availableUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {`${getFullName({ first_name: user.first_name, last_name: user.last_name })} - ${getRoleLabel(user.role_name)}`}
                    </option>
                  ))}
                </Form.Select>

                <Button variant="dark" disabled={!selectedUserId || isAdding} onClick={handleAdd}>
                  {isAdding ? (
                    <>
                      <Spinner size="sm" className="me-2" />
                      Dodawanie...
                    </>
                  ) : (
                    "Dodaj"
                  )}
                </Button>
              </div>
            )}
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-4">
            <Spinner className="me-2" />
            Ładowanie członków projektu...
          </div>
        ) : members.length === 0 ? (
          <Alert variant="secondary" className="mb-0">
            Ten projekt nie ma jeszcze członków.
          </Alert>
        ) : (
          <Table responsive hover className="mb-0 align-middle">
            <thead>
              <tr>
                <th>Imię i nazwisko</th>
                <th>E-mail</th>
                <th>Telefon</th>
                <th>Rola</th>
                {canManage && <th>Akcje</th>}
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.id}>
                  <td>{getFullName(member)}</td>
                  <td>{member.email || "-"}</td>
                  <td>{member.phone || "-"}</td>
                  <td>
                    <Badge bg="light" text="dark" className="border">
                      {getRoleLabel(member.role_name)}
                    </Badge>
                  </td>
                  {canManage && (
                    <td>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        disabled={removingUserId === member.user_id || project.created_by_user_id === member.user_id}
                        onClick={() => onRemoveMember(member.user_id)}
                      >
                        {removingUserId === member.user_id ? (
                          <>
                            <Spinner size="sm" className="me-2" />
                            Usuwanie...
                          </>
                        ) : project.created_by_user_id === member.user_id ? (
                          "Autor projektu"
                        ) : (
                          "Usuń"
                        )}
                      </Button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card.Body>
    </Card>
  );
}

export default ProjectMembersPanel;
