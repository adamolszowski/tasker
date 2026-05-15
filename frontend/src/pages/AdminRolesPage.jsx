import React, { useEffect, useState } from "react";
import Card from "react-bootstrap/Card";
import Alert from "react-bootstrap/Alert";
import Button from "react-bootstrap/Button";
import Table from "react-bootstrap/Table";
import Form from "react-bootstrap/Form";
import Badge from "react-bootstrap/Badge";
import Spinner from "react-bootstrap/Spinner";
import Stack from "react-bootstrap/Stack";

// Adres backendu - stad pobieramy i wysylamy dane
const API_URL = "http://localhost:5000";

// Dostepne role do wybrania w selectach
const ROLE_OPTIONS = [
  { value: "pracownik", label: "Pracownik" },
  { value: "kierownik", label: "Kierownik" },
  { value: "administrator", label: "Administrator" },
];

function AdminRolesPage({ authToken, authenticatedUser }) {
  // Lista uzytkownikow bez roli, czyli takich co czekaja na aktywacje
  const [pendingUsers, setPendingUsers] = useState([]);

  // Lista uzytkownikow aktywnych, czyli takich co maja juz role
  const [activeUsers, setActiveUsers] = useState([]);

  // Tu trzymamy tymczasowo wybrane role dla userow oczekujacych
  // np. user o id 5 -> "pracownik"
  const [pendingRoleDrafts, setPendingRoleDrafts] = useState({});

  // Tu trzymamy tymczasowo nowe role dla aktywnych userow
  const [activeRoleDrafts, setActiveRoleDrafts] = useState({});

  // Loading dla listy oczekujacych
  const [isPendingLoading, setIsPendingLoading] = useState(true);

  // Loading dla listy aktywnych
  const [isActiveLoading, setIsActiveLoading] = useState(true);

  // ID usera, dla ktorego aktualnie trwa nadawanie roli
  const [isSubmittingPendingId, setIsSubmittingPendingId] = useState(null);

  // ID usera, dla ktorego aktualnie trwa zmiana roli
  const [isChangingRoleId, setIsChangingRoleId] = useState(null);

  // ID usera, dla ktorego aktualnie trwa odebranie roli
  const [isRevokingRoleId, setIsRevokingRoleId] = useState(null);

  // Komunikat bledu
  const [errorMessage, setErrorMessage] = useState("");

  // Komunikat sukcesu
  const [successMessage, setSuccessMessage] = useState("");

  // Sprawdzamy role zalogowanego usera
  const isAdmin = authenticatedUser?.role === "administrator";
  const isSuperadmin = authenticatedUser?.role === "superadmin";

  // Do tego widoku wpuszczamy tylko admina i superadmina
  const canAccessPage = isAdmin || isSuperadmin;

  // Czysci stare komunikaty, zeby nie wisialy po poprzednich akcjach
  const resetMessages = () => {
    setErrorMessage("");
    setSuccessMessage("");
  };

  // Laczymy imie i nazwisko usera w jeden tekst
  const getUserFullName = (user) => {
    const fullName = `${user.first_name || ""} ${user.last_name || ""}`.trim();
    return fullName || "-";
  };

  // Zamiana nazwy roli z backendu na ladniejszy napis na froncie
  const getRoleLabel = (roleName) => {
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
  };

  // Sprawdzamy, czy zalogowany user moze zarzadzac danym aktywnym userem
  const canManageActiveUser = (targetUser) => {
    // Jak nie mamy danych to od razu blokujemy
    if (!authenticatedUser || !targetUser) {
      return false;
    }

    // Nie pozwalamy zarzadzac samym soba z tego widoku
    if (authenticatedUser.id === targetUser.id) {
      return false;
    }

    // Nikt nie rusza superadmina z tego miejsca
    if (targetUser.role_name === "superadmin") {
      return false;
    }

    // Superadmin moze zarzadzac wszystkimi poza superadminem
    if (authenticatedUser.role === "superadmin") {
      return true;
    }

    // Administrator nie moze zarzadzac administratorem ani superadminem
    if (authenticatedUser.role === "administrator") {
      return (
        targetUser.role_name !== "administrator" &&
        targetUser.role_name !== "superadmin"
      );
    }

    // W innych przypadkach brak uprawnien
    return false;
  };

  // Pobiera liste userow oczekujacych na aktywacje
  const fetchPendingUsers = async () => {
    // Bez tokenu nie ma sensu robic requestu
    if (!authToken) {
      setIsPendingLoading(false);
      return;
    }

    try {
      setIsPendingLoading(true);

      const response = await fetch(`${API_URL}/api/admin/pending-users`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      const data = await response.json();

      // Jak backend zwrocil blad, pokazujemy komunikat
      if (!response.ok) {
        setErrorMessage(
          data.message || "Nie udało się pobrać użytkowników oczekujących."
        );
        setPendingUsers([]);
        return;
      }

      // Jak wszystko git, zapisujemy userow do stanu
      setPendingUsers(data.users || []);
    } catch (error) {
      setErrorMessage("Nie udało się połączyć z backendem.");
      setPendingUsers([]);
    } finally {
      setIsPendingLoading(false);
    }
  };

  // Pobiera liste aktywnych userow
  const fetchActiveUsers = async () => {
    if (!authToken) {
      setIsActiveLoading(false);
      return;
    }

    try {
      setIsActiveLoading(true);

      const response = await fetch(`${API_URL}/api/admin/active-users`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(
          data.message || "Nie udało się pobrać aktywnych użytkowników."
        );
        setActiveUsers([]);
        return;
      }

      setActiveUsers(data.users || []);
    } catch (error) {
      setErrorMessage("Nie udało się połączyć z backendem.");
      setActiveUsers([]);
    } finally {
      setIsActiveLoading(false);
    }
  };

  // Odswieza wszystko naraz
  const refreshAll = async () => {
    resetMessages();

    // Superadmin widzi wszystko
    if (isSuperadmin) {
      await Promise.all([fetchPendingUsers(), fetchActiveUsers()]);
      return;
    }

    // Administrator pobiera tylko aktywnych userow
    await fetchActiveUsers();
  };

  // Po wejsciu do widoku pobieramy dane
  useEffect(() => {
    if (!canAccessPage) {
      setIsPendingLoading(false);
      setIsActiveLoading(false);
      return;
    }

    // Superadmin ma dostep do obu sekcji
    if (isSuperadmin) {
      refreshAll();
      return;
    }

    // Administrator nie aktywuje nowych kont,
    // wiec nie pobieramy pending users
    setPendingUsers([]);
    setIsPendingLoading(false);
    fetchActiveUsers();
  }, [authToken, authenticatedUser?.role]);

  // Zapis wybranej roli dla usera oczekujacego
  const handlePendingRoleChange = (userId, role) => {
    setPendingRoleDrafts((prev) => ({
      ...prev,
      [userId]: role,
    }));
  };

  // Zapis nowej roli dla aktywnego usera
  const handleActiveRoleChange = (userId, role) => {
    setActiveRoleDrafts((prev) => ({
      ...prev,
      [userId]: role,
    }));
  };

  // Nadaje role userowi oczekujacemu
  const handleApproveRole = async (userId) => {
    const selectedRole = pendingRoleDrafts[userId];

    // Jak nic nie wybrano, nie wysylamy requestu
    if (!selectedRole) {
      setErrorMessage("Najpierw wybierz rolę dla użytkownika.");
      setSuccessMessage("");
      return;
    }

    try {
      setIsSubmittingPendingId(userId);
      resetMessages();

      const response = await fetch(
        `${API_URL}/api/admin/users/${userId}/approve-role`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            role: selectedRole,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(
          data.message || "Nie udało się nadać roli użytkownikowi."
        );
        return;
      }

      setSuccessMessage(data.message || "Rola została nadana użytkownikowi.");

      // Po sukcesie usuwamy usera z listy oczekujacych
      setPendingUsers((prev) => prev.filter((user) => user.id !== userId));

      // Czyścimy draft selecta dla tego usera
      setPendingRoleDrafts((prev) => {
        const updated = { ...prev };
        delete updated[userId];
        return updated;
      });

      // Odswiezamy aktywnych, bo ten user powinien tam juz trafic
      await fetchActiveUsers();
    } catch (error) {
      setErrorMessage("Nie udało się połączyć z backendem.");
    } finally {
      setIsSubmittingPendingId(null);
    }
  };

  // Zmienia role aktywnemu userowi
  const handleChangeRole = async (userId) => {
    const selectedRole = activeRoleDrafts[userId];

    if (!selectedRole) {
      setErrorMessage("Najpierw wybierz nową rolę.");
      setSuccessMessage("");
      return;
    }

    try {
      setIsChangingRoleId(userId);
      resetMessages();

      const response = await fetch(
        `${API_URL}/api/admin/users/${userId}/change-role`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            role: selectedRole,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(
          data.message || "Nie udało się zmienić roli użytkownika."
        );
        return;
      }

      setSuccessMessage(data.message || "Rola użytkownika została zmieniona.");

      // Czyscimy wybrana nowa role po sukcesie
      setActiveRoleDrafts((prev) => {
        const updated = { ...prev };
        delete updated[userId];
        return updated;
      });

      // Odswiezamy listy
      await fetchActiveUsers();
      await fetchPendingUsers();
    } catch (error) {
      setErrorMessage("Nie udało się połączyć z backendem.");
    } finally {
      setIsChangingRoleId(null);
    }
  };

  // Odbiera role aktywnemu userowi
  const handleRevokeRole = async (userId) => {
    try {
      setIsRevokingRoleId(userId);
      resetMessages();

      const response = await fetch(
        `${API_URL}/api/admin/users/${userId}/revoke-role`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(
          data.message || "Nie udało się odebrać roli użytkownikowi."
        );
        return;
      }

      setSuccessMessage(data.message || "Rola została odebrana użytkownikowi.");

      // Po odebraniu roli user moze wrocic do listy oczekujacych
      await fetchActiveUsers();
      await fetchPendingUsers();
    } catch (error) {
      setErrorMessage("Nie udało się połączyć z backendem.");
    } finally {
      setIsRevokingRoleId(null);
    }
  };

  // Jak nie ma usera, to nie ma sensu pokazywac strony
  if (!authenticatedUser) {
    return (
      <Alert variant="warning">
        Musisz być zalogowany, aby wejść do zarządzania rolami.
      </Alert>
    );
  }

  // Jak user nie ma odpowiedniej roli, blokujemy widok
  if (!canAccessPage) {
    return (
      <Alert variant="danger">
        Ten widok jest dostępny tylko dla administratora i superadministratora.
      </Alert>
    );
  }

  return (
    <div>
      {/* Gorna karta z tytulem i podstawowymi licznikami */}
      <Card className="mb-4 border">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div>
              <h2 className="mb-1">ZARZĄDZANIE ROLAMI</h2>
              <p className="text-muted mb-0">
                Nadawanie, zmiana i odbieranie ról użytkownikom systemu
              </p>
            </div>

            <Stack direction="horizontal" gap={2}>
              <Badge bg="light" text="dark" className="border px-3 py-2">
                Oczekujący: {pendingUsers.length}
              </Badge>
              <Badge bg="light" text="dark" className="border px-3 py-2">
                Aktywni: {activeUsers.length}
              </Badge>
              <Button variant="outline-dark" onClick={refreshAll}>
                Odśwież
              </Button>
            </Stack>
          </div>
        </Card.Body>
      </Card>

      {/* Komunikat bledu */}
      {errorMessage && (
        <Alert variant="danger" className="mb-3">
          {errorMessage}
        </Alert>
      )}

      {/* Komunikat sukcesu */}
      {successMessage && (
        <Alert variant="success" className="mb-3">
          {successMessage}
        </Alert>
      )}

      {/* Sekcja userow oczekujacych */}
      <Card className="mb-4 border">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h4 className="mb-0">Użytkownicy oczekujący na aktywację</h4>
            <Badge bg="light" text="dark" className="border">
              {pendingUsers.length}
            </Badge>
          </div>

          {/* Administrator nie aktywuje nowych kont */}
          {!isSuperadmin ? (
            <Alert variant="info" className="mb-0">
              Aktywacja nowych kont i pierwsze nadawanie ról jest dostępne tylko
              dla superadministratora.
            </Alert>
          ) : isPendingLoading ? (
            <div className="text-center py-4">
              <Spinner className="me-2" />
              Ładowanie użytkowników oczekujących...
            </div>
          ) : pendingUsers.length === 0 ? (
            <Alert variant="secondary" className="mb-0">
              Brak użytkowników oczekujących na nadanie roli.
            </Alert>
          ) : (
            <Table responsive hover className="mb-0 align-middle">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Login</th>
                  <th>Imię i nazwisko</th>
                  <th>E-mail</th>
                  <th>Telefon</th>
                  <th>Nowa rola</th>
                  <th>Akcja</th>
                </tr>
              </thead>
              <tbody>
                {pendingUsers.map((user) => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>{user.login}</td>
                    <td>{getUserFullName(user)}</td>
                    <td>{user.email || "-"}</td>
                    <td>{user.phone || "-"}</td>
                    <td style={{ minWidth: "220px" }}>
                      <Form.Select
                        value={pendingRoleDrafts[user.id] || ""}
                        onChange={(event) =>
                          handlePendingRoleChange(user.id, event.target.value)
                        }
                        disabled={isSubmittingPendingId === user.id}
                      >
                        <option value="">Wybierz rolę...</option>

                        {ROLE_OPTIONS.map((roleOption) => (
                          <option
                            key={roleOption.value}
                            value={roleOption.value}
                          >
                            {roleOption.label}
                          </option>
                        ))}
                      </Form.Select>
                    </td>
                    <td>
                      <Button
                        variant="dark"
                        onClick={() => handleApproveRole(user.id)}
                        disabled={isSubmittingPendingId === user.id}
                      >
                        {isSubmittingPendingId === user.id ? (
                          <>
                            <Spinner size="sm" className="me-2" />
                            Zatwierdzanie...
                          </>
                        ) : (
                          "Nadaj rolę"
                        )}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Sekcja aktywnych userow */}
      <Card className="border">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h4 className="mb-0">Aktywni użytkownicy</h4>
            <Badge bg="light" text="dark" className="border">
              {activeUsers.length}
            </Badge>
          </div>

          {isActiveLoading ? (
            <div className="text-center py-4">
              <Spinner className="me-2" />
              Ładowanie aktywnych użytkowników...
            </div>
          ) : activeUsers.length === 0 ? (
            <Alert variant="secondary" className="mb-0">
              Brak aktywnych użytkowników.
            </Alert>
          ) : (
            <Table responsive hover className="mb-0 align-middle">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Login</th>
                  <th>Imię i nazwisko</th>
                  <th>E-mail</th>
                  <th>Telefon</th>
                  <th>Obecna rola</th>
                  <th>Nowa rola</th>
                  <th>Akcje</th>
                </tr>
              </thead>
              <tbody>
                {activeUsers.map((user) => {
                  const canManage = canManageActiveUser(user);

                  return (
                    <tr key={user.id}>
                      <td>{user.id}</td>
                      <td>{user.login}</td>
                      <td>{getUserFullName(user)}</td>
                      <td>{user.email || "-"}</td>
                      <td>{user.phone || "-"}</td>
                      <td>
                        <Badge bg="light" text="dark" className="border">
                          {getRoleLabel(user.role_name)}
                        </Badge>
                      </td>
                      <td style={{ minWidth: "220px" }}>
                        <Form.Select
                          value={activeRoleDrafts[user.id] || ""}
                          onChange={(event) =>
                            handleActiveRoleChange(user.id, event.target.value)
                          }
                          disabled={
                            !canManage ||
                            isChangingRoleId === user.id ||
                            isRevokingRoleId === user.id
                          }
                        >
                          <option value="">Wybierz nową rolę...</option>

                          {ROLE_OPTIONS.map((roleOption) => (
                            <option
                              key={roleOption.value}
                              value={roleOption.value}
                            >
                              {roleOption.label}
                            </option>
                          ))}
                        </Form.Select>
                      </td>
                      <td>
                        {canManage ? (
                          <Stack direction="horizontal" gap={2}>
                            <Button
                              variant="outline-dark"
                              onClick={() => handleChangeRole(user.id)}
                              disabled={
                                isChangingRoleId === user.id ||
                                isRevokingRoleId === user.id
                              }
                            >
                              {isChangingRoleId === user.id ? (
                                <>
                                  <Spinner size="sm" className="me-2" />
                                  Zmiana...
                                </>
                              ) : (
                                "Zmień rolę"
                              )}
                            </Button>

                            <Button
                              variant="outline-danger"
                              onClick={() => handleRevokeRole(user.id)}
                              disabled={
                                isChangingRoleId === user.id ||
                                isRevokingRoleId === user.id
                              }
                            >
                              {isRevokingRoleId === user.id ? (
                                <>
                                  <Spinner size="sm" className="me-2" />
                                  Odbieranie...
                                </>
                              ) : (
                                "Odbierz rolę"
                              )}
                            </Button>
                          </Stack>
                        ) : (
                          <span className="text-muted small">
                            Brak uprawnień
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
    </div>
  );
}

export default AdminRolesPage;