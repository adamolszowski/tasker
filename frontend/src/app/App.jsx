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
import AdminRolesPage from "../pages/AdminRolesPage";
import UsersPage from "../pages/UserPage";

// Adres backendu - uzywamy go glownie do sprawdzania sesji przez /api/auth/me
const API_URL = "http://localhost:5000";

// Funkcja pomocnicza do zamiany roli z backendu
// na role uzywana we froncie.
// Backend zwraca np. "superadmin", a we froncie mamy stale z routes.jsx
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

// Glowny komponent calej aplikacji.
// To tutaj trzymamy informacje:
// - kto jest zalogowany
// - jaki mamy token
// - jaki widok pokazac
// - czy sesja po odswiezeniu dalej jest wazna
function App() {
  // selectedRole sluzy glownie do panelu mocka i testowania UI
  const [selectedRole, setSelectedRole] = useState(ROLES.GUEST);

  // currentRoute mowi, jaki widok jest aktualnie pokazany
  // np. login, register, dashboard, users itp.
  const [currentRoute, setCurrentRoute] = useState("login");

  // Sterowanie wysuwanym panelem mocka
  const [showPanel, setShowPanel] = useState(false);

  // Tu trzymamy dane realnie zalogowanego usera z backendu
  const [authenticatedUser, setAuthenticatedUser] = useState(null);

  // Token JWT - na starcie probujemy go pobrac z localStorage
  const [authToken, setAuthToken] = useState(
    localStorage.getItem("token") || ""
  );

  // Flaga informujaca, czy trwa sprawdzanie sesji po odswiezeniu strony
  // Dzieki temu nie miga przez chwile ekran logowania
  const [isAuthLoading, setIsAuthLoading] = useState(
    !!localStorage.getItem("token")
  );

  // Wyliczamy liste widokow dostepnych dla aktualnej roli
  // useMemo robi to tylko wtedy, gdy selectedRole sie zmieni
  const availableRoutes = useMemo(() => {
    return APP_ROUTES.filter((route) => route.roles.includes(selectedRole));
  }, [selectedRole]);

  // Po starcie aplikacji albo po zmianie tokenu sprawdzamy,
  // czy sesja dalej jest wazna.
  // Jesli token jest poprawny, backend zwroci dane usera.
  // Jesli nie - czyscimy wszystko i wracamy do logowania.
  useEffect(() => {
    const loadCurrentUser = async () => {
      // Jak nie ma tokenu, to nie ma co sprawdzac
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

        // Jesli backend odrzuci token, czyscimy sesje
        if (!response.ok) {
          localStorage.removeItem("token");
          setAuthToken("");
          setAuthenticatedUser(null);
          setSelectedRole(ROLES.GUEST);
          setCurrentRoute("login");
          setIsAuthLoading(false);
          return;
        }

        // Jesli token jest poprawny, zapisujemy usera
        setAuthenticatedUser(data.user);

        // Ustawiamy role zgodnie z backendem
        setSelectedRole(mapBackendRoleToFrontendRole(data.user.role));

        // Po poprawnym odczycie sesji pokazujemy dashboard
        setCurrentRoute("dashboard");
        setIsAuthLoading(false);
      } catch (error) {
        // Jak backend nie odpowiada albo cos sie wywali,
        // tez czyscimy sesje
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

  // Zmiana roli z panelu mocka.
  // To jest glownie pomocnicze do testow wizualnych.
  const handleRoleChange = (event) => {
    const newRole = event.target.value;
    setSelectedRole(newRole);

    // Szukamy pierwszego widoku dostepnego dla nowej roli
    const firstAvailableRoute = APP_ROUTES.find((route) =>
      route.roles.includes(newRole)
    );

    // Jak nie jestesmy na login / register,
    // to mozemy przeskoczyc na pierwszy dostepny widok
    if (
      firstAvailableRoute &&
      currentRoute !== "login" &&
      currentRoute !== "register"
    ) {
      setCurrentRoute(firstAvailableRoute.id);
    }
  };

  // Ta funkcja uruchamia sie po poprawnym logowaniu z LoginPage.jsx.
  // Dostaje z backendu token i dane usera.
  const handleLoginSuccess = (data) => {
    // Zapisujemy token w localStorage, zeby przetrwal odswiezenie strony
    localStorage.setItem("token", data.token);

    // Zapisujemy token i usera w stanie aplikacji
    setAuthToken(data.token);
    setAuthenticatedUser(data.user);

    // Ustawiamy role na podstawie danych z backendu
    setSelectedRole(mapBackendRoleToFrontendRole(data.user.role));

    // Po loginie przechodzimy do glownego widoku
    setCurrentRoute("dashboard");
  };

  // Wylogowanie:
  // - usuwamy token
  // - czyscimy dane usera
  // - wracamy do ekranu logowania
  const handleLogout = () => {
    localStorage.removeItem("token");
    setAuthToken("");
    setAuthenticatedUser(null);
    setSelectedRole(ROLES.GUEST);
    setCurrentRoute("login");
  };

  // currentUser to dane do wyswietlenia w headerze.
  // Jak mamy prawdziwego usera z backendu, to pokazujemy jego dane.
  // Jak nie, to lecimy na danych mockowych zaleznich od selectedRole.
  const currentUser = authenticatedUser
    ? {
        name:
          `${authenticatedUser.firstName || ""} ${
            authenticatedUser.lastName || ""
          }`.trim() || authenticatedUser.login,
        initials: (
          `${authenticatedUser.firstName?.[0] || ""}${
            authenticatedUser.lastName?.[0] || ""
          }` ||
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

  // Prosta funkcja pomocnicza do placeholderow.
  // Uzywamy jej dla widokow, ktore jeszcze nie sa rozwiniete.
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

  // Tutaj decydujemy, jaki widok ma sie aktualnie pokazac.
  // To taki prosty reczny routing wewnatrz aplikacji.
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
        return (
          <div className="min-vh-100 bg-light">
            <AppHeader currentUser={currentUser} onLogout={handleLogout} />

            <div className="d-flex">
              <AppSidebar
                currentRoute={currentRoute}
                onNavigate={setCurrentRoute}
              />

              {/* Prawdziwy widok listy uzytkownikow */}
              <div className="flex-grow-1 p-4">
                <UsersPage
                  authToken={authToken}
                  authenticatedUser={authenticatedUser}
                />
              </div>
            </div>
          </div>
        );

      case "chat":
        return renderPlaceholder("CZAT");

      case "notifications":
        return renderPlaceholder("POWIADOMIENIA");

      case "admin-roles":
        return (
          <div className="min-vh-100 bg-light">
            <AppHeader currentUser={currentUser} onLogout={handleLogout} />

            <div className="d-flex">
              <AppSidebar
                currentRoute={currentRoute}
                onNavigate={setCurrentRoute}
              />

              {/* Prawdziwy widok zarzadzania rolami */}
              <div className="flex-grow-1 p-4">
                <AdminRolesPage
                  authToken={authToken}
                  authenticatedUser={authenticatedUser}
                />
              </div>
            </div>
          </div>
        );

      default:
        return <h2>Brak widoku</h2>;
    }
  };

  // Jak trwa sprawdzanie sesji po odswiezeniu,
  // to pokazujemy prosty ekran ladowania
  if (isAuthLoading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
        <div>Ładowanie sesji...</div>
      </div>
    );
  }

  return (
    <div className="min-vh-100 bg-light position-relative">
      {/* Panel mocka - taki pomocniczy panel do testow UI */}
      <Button
        variant="dark"
        className="position-fixed top-0 start-0 m-3"
        style={{ zIndex: 1050 }}
        onClick={() => setShowPanel(true)}
      >
        Panel mocka
      </Button>

      {/* Tutaj renderujemy aktualny widok aplikacji */}
      <Container
        fluid
        className="min-vh-100 d-flex align-items-center justify-content-center p-0"
      >
        <div className="w-100">{renderCurrentView()}</div>
      </Container>

      {/* Offcanvas = wysuwany panel boczny do testowania rol i widokow */}
      <Offcanvas
        show={showPanel}
        onHide={() => setShowPanel(false)}
        placement="start"
      >
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>Panel mocka</Offcanvas.Title>
        </Offcanvas.Header>

        <Offcanvas.Body>
          {/* Select do recznej zmiany roli testowej */}
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

          {/* Pokazujemy jaka rola jest aktualnie ustawiona */}
          <div className="mb-3">
            <strong>Aktualna rola:</strong> {currentUser.roleLabel}
          </div>

          <hr />

          <h5 className="mb-3">Dostępne widoki</h5>

          <ListGroup>
            {/* Reczne otwarcie widoku logowania */}
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

            {/* Reczne otwarcie widoku rejestracji */}
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

            {/* Lista widokow dostepnych dla aktualnej roli */}
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