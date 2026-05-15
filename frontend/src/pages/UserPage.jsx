import React, { useEffect, useMemo, useState } from "react";
import Card from "react-bootstrap/Card";
import Form from "react-bootstrap/Form";
import Table from "react-bootstrap/Table";
import Badge from "react-bootstrap/Badge";
import Alert from "react-bootstrap/Alert";
import Spinner from "react-bootstrap/Spinner";

// Adres backendu - stad pobieramy liste userow
const API_URL = "http://localhost:5000";

// Zamienia nazwe roli z backendu na ladniejszy tekst na froncie
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

// Laczy imie i nazwisko usera w jeden napis
function getFullName(user) {
  const fullName = `${user.first_name || ""} ${user.last_name || ""}`.trim();

  // Jak nie ma imienia i nazwiska, zwracamy prosty tekst zastepczy
  return fullName || "Brak danych";
}

function UsersPage({ authToken, authenticatedUser }) {
  // Tu bedzie cala lista userow z backendu
  const [users, setUsers] = useState([]);

  // Tekst wpisany w wyszukiwarke
  const [searchTerm, setSearchTerm] = useState("");

  // Loading podczas pobierania danych
  const [isLoading, setIsLoading] = useState(true);

  // Komunikat bledu, np. gdy backend nie odpowiada
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    // Funkcja pobiera userow z backendu
    const fetchUsers = async () => {
      // Bez tokenu nie ma sensu wysylac requestu
      if (!authToken) {
        setErrorMessage("Brak tokenu autoryzacji.");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setErrorMessage("");

        const response = await fetch(`${API_URL}/api/users`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });

        const data = await response.json();

        // Jak backend zwroci blad, pokazujemy komunikat
        if (!response.ok) {
          setErrorMessage(
            data.message || "Nie udało się pobrać listy użytkowników."
          );
          setUsers([]);
          return;
        }

        // Zapisujemy userow do stanu
        setUsers(data.users || []);
      } catch (error) {
        setErrorMessage("Nie udało się połączyć z backendem.");
        setUsers([]);
      } finally {
        setIsLoading(false);
      }
    };

    // Pobieramy userow tylko wtedy, gdy ktos jest zalogowany
    if (authenticatedUser) {
      fetchUsers();
    } else {
      setIsLoading(false);
    }
  }, [authToken, authenticatedUser]);

  // useMemo robi filtrowanie tylko wtedy, gdy zmienia sie lista userow
  // albo tekst w wyszukiwarce
  const filteredUsers = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    // Jak nic nie wpisano, zwracamy cala liste
    if (!query) {
      return users;
    }

    // Filtrujemy po kilku polach naraz
    return users.filter((user) => {
      const fullName = getFullName(user).toLowerCase();
      const email = (user.email || "").toLowerCase();
      const phone = (user.phone || "").toLowerCase();
      const role = getRoleLabel(user.role_name).toLowerCase();

      return (
        fullName.includes(query) ||
        email.includes(query) ||
        phone.includes(query) ||
        role.includes(query)
      );
    });
  }, [users, searchTerm]);

  // Jak nikt nie jest zalogowany, blokujemy widok
  if (!authenticatedUser) {
    return (
      <Alert variant="warning">
        Musisz być zalogowany, aby zobaczyć listę użytkowników.
      </Alert>
    );
  }

  return (
    <div>
      {/* Gorna karta z tytulem i wyszukiwarka */}
      <Card className="mb-4 border">
        <Card.Body>
          <h2 className="mb-1">UŻYTKOWNICY</h2>
          <p className="text-muted mb-4">
            Lista użytkowników systemu i ich podstawowe dane
          </p>

          {/* Prosta wyszukiwarka po imieniu, mailu, telefonie i roli */}
          <Form.Control
            style={{ maxWidth: "360px" }}
            type="text"
            placeholder="Szukaj użytkownika..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </Card.Body>
      </Card>

      {/* Komunikat bledu */}
      {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}

      {/* Loading podczas pobierania danych */}
      {isLoading ? (
        <Card className="border">
          <Card.Body className="text-center py-4">
            <Spinner className="me-2" />
            Ładowanie użytkowników...
          </Card.Body>
        </Card>
      ) : filteredUsers.length === 0 ? (
        // Jak po filtrowaniu nic nie ma
        <Alert variant="secondary">Brak użytkowników do wyświetlenia.</Alert>
      ) : (
        // Gdy wszystko jest okej, pokazujemy tabele
        <Card className="border">
          <Card.Body className="p-0">
            <Table responsive hover className="mb-0 align-middle">
              <thead>
                <tr>
                  <th>Imię i nazwisko</th>
                  <th>E-mail</th>
                  <th>Telefon</th>
                  <th>Rola</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td>{getFullName(user)}</td>
                    <td>{user.email || "-"}</td>
                    <td>{user.phone || "-"}</td>
                    <td>
                      <Badge bg="light" text="dark" className="border">
                        {getRoleLabel(user.role_name)}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}
    </div>
  );
}

export default UsersPage;