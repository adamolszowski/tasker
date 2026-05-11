import React, { useEffect, useMemo, useState } from "react";
import Container from "react-bootstrap/Container";
import Button from "react-bootstrap/Button";
import ListGroup from "react-bootstrap/ListGroup";
import Form from "react-bootstrap/Form";
import Offcanvas from "react-bootstrap/Offcanvas";
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import AppHeader from "../components/layout/AppHeader";
import AppSidebar from "../components/layout/AppSidebar";
import { APP_ROUTES, ROLES } from "./routes";

// Adres backendu - używamy go przy /api/auth/me
const API_URL = "http://localhost:5000";

// Funkcja zamienia nazwę roli z backendu na rolę używaną we froncie
// Backend zwraca np. "superadmin", a we froncie mamy stałe z routes.jsx
function mapBackendRoleToFrontendRole(role) {
  switch (role) {
    case "pracownik":
      return ROLES.PRACOWNIK;
    case "kierownik":
      return ROLES.KIEROWNIK;
    case "administrator":
      return ROLES.ADMINISTRATOR;
    case "superadmin":
      return ROLES.SUPERADMIN;
    default:
      return ROLES.GUEST;
  }
}

function App() {
  // selectedRole służy głównie do mockowego panelu po lewej
  // oraz do pokazywania placeholderów dla różnych ról
  const [selectedRole, setSelectedRole] = useState(ROLES.GUEST);

  // currentRoute mówi, jaki widok aktualnie pokazujemy
  // np. login, register, dashboard, users itd.
  const [currentRoute, setCurrentRoute] = useState("login");

  // Sterowanie wysuwanym panelem mocka
  const [showPanel, setShowPanel] = useState(false);

  // authenticatedUser - tu trzymamy dane aktualnie zalogowanego usera
  // np. id, login, firstName, lastName, email, role
  const [authenticatedUser, setAuthenticatedUser] = useState(null);

  // authToken - token JWT
  // Na starcie próbujemy go pobrać z localStorage
  const [authToken, setAuthToken] = useState(localStorage.getItem("token") || "");

  // isAuthLoading - informacja, czy właśnie sprawdzamy sesję po odświeżeniu strony
  // Dzięki temu nie miga chwilowo ekran logowania
  const [isAuthLoading, setIsAuthLoading] = useState(
    !!localStorage.getItem("token")
  );

  // Wyliczamy listę widoków dostępnych dla aktualnej roli
  // useMemo robi to tylko wtedy, gdy selectedRole się zmieni
  const availableRoutes = useMemo(() => {
    return APP_ROUTES.filter((route) => route.roles.includes(selectedRole));
  }, [selectedRole]);

  // useEffect uruchamia się po zmianie authToken
  // Jego zadanie:
  // - jeśli token istnieje, zapytać backend o /api/auth/me
  // - jeśli token jest poprawny, przywrócić sesję użytkownika
  // - jeśli token jest zły lub wygasł, wyczyścić sesję
  useEffect(() => {
    const loadCurrentUser = async () => {
      // Jeśli nie ma tokenu, nie ma co sprawdzać
      if (!authToken) {
        setIsAuthLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/api/auth/me`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });

        const data = await response.json();

        // Jeśli backend odrzuci token, czyścimy sesję
        if (!response.ok) {
          localStorage.removeItem("token");
          setAuthToken("");
          setAuthenticatedUser(null);
          setSelectedRole(ROLES.GUEST);
          setCurrentRoute("login");
          setIsAuthLoading(false);
          return;
        }

        // Jeśli token jest poprawny, zapisujemy usera
        setAuthenticatedUser(data.user);

        // Ustawiamy rolę zgodnie z danymi z backendu
        setSelectedRole(mapBackendRoleToFrontendRole(data.user.role));

        // Po poprawnym odczycie sesji pokazujemy dashboard
        setCurrentRoute("dashboard");
        setIsAuthLoading(false);
      } catch (error) {
        // Jeśli backend nie odpowiada albo coś się wywali,
        // też czyścimy sesję
        localStorage.removeItem("token");
        setAuthToken("");
        setAuthenticatedUser(null);
        setSelectedRole(ROLES.GUEST);
        setCurrentRoute("login");
        setIsAuthLoading(false);
      }
    };

    loadCurrentUser();
  }, [authToken]);

  // Zmiana roli z panelu mocka
  // To jest głównie pomocnicze przy testach UI
  const handleRoleChange = (event) => {
    const newRole = event.target.value;
    setSelectedRole(newRole);

    // Szukamy pierwszego widoku dostępnego dla danej roli
    const firstAvailableRoute = APP_ROUTES.find((route) =>
      route.roles.includes(newRole)
    );

    // Jeśli nie jesteśmy na login/register, możemy przeskoczyć
    // na pierwszy dostępny widok dla tej roli
    if (
      firstAvailableRoute &&
      currentRoute !== "login" &&
      currentRoute !== "register"
    ) {
      setCurrentRoute(firstAvailableRoute.id);
    }
  };

  // Ta funkcja uruchamia się po poprawnym logowaniu z LoginPage.jsx
  // Odbiera dane z backendu: token i user
  const handleLoginSuccess = (data) => {
    // Zapisujemy token do localStorage, żeby przetrwał odświeżenie strony
    localStorage.setItem("token", data.token);

    // Zapisujemy token i usera w stanie aplikacji
    setAuthToken(data.token);
    setAuthenticatedUser(data.user);

    // Ustawiamy rolę zgodnie z backendem
    setSelectedRole(mapBackendRoleToFrontendRole(data.user.role));

    // Po loginie przechodzimy na dashboard
    setCurrentRoute("dashboard");
  };

  // Logout:
  // - usuwamy token z localStorage
  // - czyścimy stan usera
  // - wracamy do login
  const handleLogout = () => {
    localStorage.removeItem("token");
    setAuthToken("");
    setAuthenticatedUser(null);
    setSelectedRole(ROLES.GUEST);
    setCurrentRoute("login");
  };

  // currentUser to dane do wyświetlenia w headerze
  // Jeśli user jest zalogowany naprawdę, bierzemy dane z backendu
  // Jeśli nie, używamy danych mockowych zależnych od selectedRole
  const currentUser = authenticatedUser
    ? {
        name:
          `${authenticatedUser.firstName || ""} ${authenticatedUser.lastName || ""}`.trim() ||
          authenticatedUser.login,
        initials: (
          `${authenticatedUser.firstName?.[0] || ""}${authenticatedUser.lastName?.[0] || ""}` ||
          authenticatedUser.login?.slice(0, 2) ||
          "U"
        ).toUpperCase(),
        roleLabel:
          authenticatedUser.role === "pracownik"
            ? "Pracownik"
            : authenticatedUser.role === "kierownik"
            ? "Kierownik"
            : authenticatedUser.role === "administrator"
            ? "Administrator"
            : authenticatedUser.role === "superadmin"
            ? "Superadministrator"
            : "Użytkownik",
      }
    : {
        name:
          selectedRole === ROLES.PRACOWNIK
            ? "Anna Nowak"
            : selectedRole === ROLES.KIEROWNIK
            ? "Jan Kowalski"
            : selectedRole === ROLES.ADMINISTRATOR
            ? "Marta Zielińska"
            : selectedRole === ROLES.SUPERADMIN
            ? "Super Admin"
            : "Gość",
        initials:
          selectedRole === ROLES.PRACOWNIK
            ? "AN"
            : selectedRole === ROLES.KIEROWNIK
            ? "JK"
            : selectedRole === ROLES.ADMINISTRATOR
            ? "MZ"
            : selectedRole === ROLES.SUPERADMIN
            ? "SA"
            : "G",
        roleLabel:
          selectedRole === ROLES.PRACOWNIK
            ? "Pracownik"
            : selectedRole === ROLES.KIEROWNIK
            ? "Kierownik"
            : selectedRole === ROLES.ADMINISTRATOR
            ? "Administrator"
            : selectedRole === ROLES.SUPERADMIN
            ? "Superadministrator"
            : "Gość",
      };

  // Funkcja pomocnicza do wyświetlania prostych placeholderów
  // dla widoków, których jeszcze nie podpinamy do backendu
  const renderPlaceholder = (title) => {
    return (
      <div className="min-vh-100 bg-light">
        <AppHeader currentUser={currentUser} onLogout={handleLogout} />

        <div className="d-flex">
          <AppSidebar
            currentRoute={currentRoute}
            onNavigate={setCurrentRoute}
          />

          <div className="flex-grow-1 p-4">
            <div className="border bg-white p-4">
              <h2 className="mb-1">{title}</h2>
              <p className="text-muted mb-0">
                Ten widok będzie rozwijany później.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Tu decydujemy, który widok ma się aktualnie pokazać
  const renderCurrentView = () => {
    switch (currentRoute) {
      case "login":
        return (
          <LoginPage
            onLoginSuccess={handleLoginSuccess}
            onGoToRegister={() => setCurrentRoute("register")}
          />
        );

      case "register":
        return <RegisterPage onGoToLogin={() => setCurrentRoute("login")} />;

      case "dashboard":
        return renderPlaceholder("PRZEGLĄD");

      case "projects":
        return renderPlaceholder("PROJEKTY");

      case "tasks":
        return renderPlaceholder("ZADANIA");

      case "users":
        return renderPlaceholder("UŻYTKOWNICY");

      case "chat":
        return renderPlaceholder("CZAT");

      case "notifications":
        return renderPlaceholder("POWIADOMIENIA");

      case "admin-roles":
        return renderPlaceholder("ZARZĄDZANIE ROLAMI");

      default:
        return <h2>Brak widoku</h2>;
    }
  };

  // Jeśli trwa sprawdzanie sesji po odświeżeniu,
  // pokazujemy prosty ekran ładowania
  if (isAuthLoading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
        <div>Ładowanie sesji...</div>
      </div>
    );
  }

  return (
    <div className="min-vh-100 bg-light position-relative">
      {/* Panel mocka - pomocniczy panel do testów */}
      <Button
        variant="dark"
        className="position-fixed top-0 start-0 m-3"
        style={{ zIndex: 1050 }}
        onClick={() => setShowPanel(true)}
      >
        Panel mocka
      </Button>

      {/* Tu renderujemy aktualny widok */}
      <Container
        fluid
        className="min-vh-100 d-flex align-items-center justify-content-center p-0"
      >
        <div className="w-100">{renderCurrentView()}</div>
      </Container>

      {/* Offcanvas - boczny wysuwany panel testowy */}
      <Offcanvas
        show={showPanel}
        onHide={() => setShowPanel(false)}
        placement="start"
      >
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>Panel mocka</Offcanvas.Title>
        </Offcanvas.Header>

        <Offcanvas.Body>
          <Form.Group className="mb-4">
            <Form.Label>Rola testowa</Form.Label>
            <Form.Select value={selectedRole} onChange={handleRoleChange}>
              <option value={ROLES.GUEST}>Gość</option>
              <option value={ROLES.PRACOWNIK}>Pracownik</option>
              <option value={ROLES.KIEROWNIK}>Kierownik</option>
              <option value={ROLES.ADMINISTRATOR}>Administrator</option>
              <option value={ROLES.SUPERADMIN}>Superadministrator</option>
            </Form.Select>
          </Form.Group>

          <div className="mb-3">
            <strong>Aktualna rola:</strong> {currentUser.roleLabel}
          </div>

          <hr />

          <h5 className="mb-3">Dostępne widoki</h5>

          <ListGroup>
            <ListGroup.Item className="d-flex justify-content-between align-items-center">
              <span>Logowanie</span>
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => setCurrentRoute("login")}
              >
                Otwórz
              </Button>
            </ListGroup.Item>

            <ListGroup.Item className="d-flex justify-content-between align-items-center">
              <span>Rejestracja</span>
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => setCurrentRoute("register")}
              >
                Otwórz
              </Button>
            </ListGroup.Item>

            {availableRoutes.map((route) => (
              <ListGroup.Item
                key={route.id}
                className="d-flex justify-content-between align-items-center"
              >
                <span>{route.label}</span>
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={() => setCurrentRoute(route.id)}
                >
                  Otwórz
                </Button>
              </ListGroup.Item>
            ))}
          </ListGroup>
        </Offcanvas.Body>
      </Offcanvas>
    </div>
  );
}

export default App;