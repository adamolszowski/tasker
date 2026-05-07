import React, { useMemo, useState } from "react";
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

function App() {
  const [selectedRole, setSelectedRole] = useState(ROLES.KIEROWNIK);
  const [currentRoute, setCurrentRoute] = useState("login");
  const [showPanel, setShowPanel] = useState(false);

  const availableRoutes = useMemo(() => {
    return APP_ROUTES.filter((route) => route.roles.includes(selectedRole));
  }, [selectedRole]);

  const handleRoleChange = (event) => {
    const newRole = event.target.value;
    setSelectedRole(newRole);
  
  const firstAvailableRoute = APP_ROUTES.find((route) =>
    route.roles.includes(newRole)
);

if (
  firstAvailableRoute &&
  currentRoute !== "login" &&
  currentRoute !== "register"
) {
  setCurrentRoute(firstAvailableRoute.id);
}
  };

  const handleMockLogin = () => {
    setCurrentRoute("dashboard");
  };

  const handleLogout = () => {
    setSelectedRole(ROLES.GUEST);
    setCurrentRoute("login");
  };

const currentUser = {
  name:
    selectedRole === ROLES.PRACOWNIK
     ? "Anna Nowak"
      :selectedRole === ROLES.KIEROWNIK
      ? "Jan Kowalski"
      :selectedRole === ROLES.ADMINISTRATOR
      ? "Marta Zielińska"
      :selectedRole === ROLES.SUPERADMIN
      ? "Super Admin"
      : "Gość",
  initials:
    selectedRole === ROLES.PRACOWNIK
      ? "AN"
      :selectedRole === ROLES.KIEROWNIK
      ? "JK"
      :selectedRole === ROLES.ADMINISTRATOR
      ? "MZ"
      :selectedRole === ROLES.SUPERADMIN
      ? "SA"
      : "G",
  roleLabel:
    selectedRole === ROLES.PRACOWNIK
    ? "Pracownik"
    : selectedRole === ROLES.KIEROWNIK
    ? "Kierownik"
    : selectedRole === ROLES.ADMINISTRATOR
    ? "Administartor"
    : selectedRole === ROLES.SUPERADMIN
    ? "Superadministrator"
    : "Gość",
};

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
          <div className="mb-1">{title}</h2>
          <p className="text-muted mb-0">
            Ten widok będzie rozwijany później.
          </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const renderCurrentView = () => {
  switch (currentRoute) {
    case "login":
      return (
        <LoginPage
        onLogin={handleMockLogin}
        onGoToRegister={() => setCurrentRoute("register")}
        />
      );
  
      case "register":
        return <RegisterPage OnGoToLogin={() => setCurrentRoute("login")} />;

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
            return <h2>Brak widoku</h2>
  }
};    

 return (
  <div className="min-vh-100 bg-light position-relative">
    <Button
    variant="dark"
    className="position-fixed top-0 start-0 m-3"
    style={{ zIndex : 1050}}
    onClick={() => setShowPanel(true)}
    >
      Panel mocka
    </Button>

    <Container
    fluid
    className="min-vh-100 d-flex align=items-center justify-content-center p-0"
    >
      <div className="w-100">{renderCurrentView()}</div>
    </Container>

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
       {selectedRole !== ROLES.GUEST && (
        <>
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
            variant="autline-secondary"
            size="sm"
            onClick={() =>setCurrentRoute("register")}
            >
              Otwórz
            </Button>
            </ListGroup.Item>
         </>  
       )}

        {availableRoutes,map((route) => (
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
 