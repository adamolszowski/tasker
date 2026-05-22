import React, { useEffect, useState } from "react";
import Container from "react-bootstrap/Container";
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import AppHeader from "../components/layout/AppHeader";
import AppSidebar from "../components/layout/AppSidebar";
import AdminRolesPage from "../pages/AdminRolesPage";
import UsersPage from "../pages/UserPage";
import ChangePasswordPage from "../pages/ChangePasswordPage";
import TasksPage from "../pages/TasksPage";

// Adres backendu - uzywamy go glownie do sprawdzania sesji przez /api/auth/me
const API_URL = "http://localhost:5000";

// Glowny komponent calej aplikacji.
// To tutaj trzymamy informacje:
// - kto jest zalogowany
// - jaki mamy token
// - jaki widok pokazac
// - czy sesja po odswiezeniu dalej jest wazna
function App() {
  // currentRoute mowi, jaki widok jest aktualnie pokazany
  // np. login, register, dashboard, users itp.
  const [currentRoute, setCurrentRoute] = useState("login");

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
          setCurrentRoute("login");
          setIsAuthLoading(false);
          return;
        }

        // Jesli token jest poprawny, zapisujemy usera
        setAuthenticatedUser(data.user);

        // Jesli user musi zmienic haslo, kierujemy go na specjalny widok
        if (data.user.mustChangePassword) {
          setCurrentRoute("change-password");
        } else {
          setCurrentRoute("dashboard");
        }

        setIsAuthLoading(false);
      } catch (error) {
        // Jak backend nie odpowiada albo cos sie wywali,
        // tez czyscimy sesje
        localStorage.removeItem("token");
        setAuthToken("");
        setAuthenticatedUser(null);
        setCurrentRoute("login");
        setIsAuthLoading(false);
      }
    };

    loadCurrentUser();
  }, [authToken]);

  // Ta funkcja uruchamia sie po poprawnym logowaniu z LoginPage.jsx.
  // Dostaje z backendu token i dane usera.
  const handleLoginSuccess = (data) => {
    // Zapisujemy token w localStorage, zeby przetrwal odswiezenie strony
    localStorage.setItem("token", data.token);

    // Zapisujemy token i usera w stanie aplikacji
    setAuthToken(data.token);
    setAuthenticatedUser(data.user);

    // Po loginie przechodzimy do glownego widoku
    if (data.user.mustChangePassword) {
      setCurrentRoute("change-password");
    } else {
      setCurrentRoute("dashboard");
    }
  };

  // Wylogowanie:
  // - usuwamy token
  // - czyscimy dane usera
  // - wracamy do ekranu logowania
  const handleLogout = () => {
    localStorage.removeItem("token");
    setAuthToken("");
    setAuthenticatedUser(null);
    setCurrentRoute("login");
  };

  const handlePasswordChanged = () => {
    setAuthenticatedUser((prev) => ({
      ...prev,
      mustChangePassword: false,
    }));

    setCurrentRoute("dashboard");
  };

  // currentUser to dane do wyswietlenia w headerze.
  // Jak mamy prawdziwego usera z backendu, to pokazujemy jego dane.
  // Jak nie ma zalogowanego usera, pokazujemy prosty fallback dla goscia.
  const currentUser = authenticatedUser
    ? {
      name:
        `${authenticatedUser.firstName || ""} ${authenticatedUser.lastName || ""
          }`.trim() || authenticatedUser.login,
      initials: (
        `${authenticatedUser.firstName?.[0] || ""}${authenticatedUser.lastName?.[0] || ""
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
      name: "Gość",
      initials: "G",
      roleLabel: "Gość",
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
            authenticatedUser={authenticatedUser}
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

      case "change-password":
        return (
          <ChangePasswordPage
            authToken={authToken}
            onPasswordChanged={handlePasswordChanged}
          />
        );

      case "dashboard":
        return renderPlaceholder("PRZEGLĄD");

      case "projects":
        return renderPlaceholder("PROJEKTY");

      case "tasks":
        return (
          <div className="min-vh-100 bg-light">
            <AppHeader currentUser={currentUser} onLogout={handleLogout} />

            <div className="d-flex">
              <AppSidebar
                currentRoute={currentRoute}
                onNavigate={setCurrentRoute}
                authenticatedUser={authenticatedUser}
              />

              <div className="flex-grow-1 p-4">
                <TasksPage
                  authToken={authToken}
                  authenticatedUser={authenticatedUser}
                />
              </div>
            </div>
          </div>
        );

      case "users":
        return (
          <div className="min-vh-100 bg-light">
            <AppHeader currentUser={currentUser} onLogout={handleLogout} />

            <div className="d-flex">
              <AppSidebar
                currentRoute={currentRoute}
                onNavigate={setCurrentRoute}
                authenticatedUser={authenticatedUser}
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
                authenticatedUser={authenticatedUser}
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
    <div className="min-vh-100 bg-light">
      {/* Tutaj renderujemy aktualny widok aplikacji */}
      <Container
        fluid
        className="min-vh-100 d-flex align-items-center justify-content-center p-0"
      >
        <div className="w-100">{renderCurrentView()}</div>
      </Container>
    </div>
  );
}

export default App;