import React from "react";
import Nav from "react-bootstrap/Nav";
import Button from "react-bootstrap/Button";

// Pomocniczy przycisk do bocznego menu.
// Dzieki temu nie powtarzamy ciagle tego samego kodu
// dla kazdego elementu nawigacji.
function SidebarButton({ label, isActive, onClick }) {
  return (
    <Button
      variant={isActive ? "dark" : "outline-dark"}
      className="w-100 text-start"
      onClick={onClick}
    >
      {label}
    </Button>
  );
}

// Lewy panel nawigacji aplikacji.
// Stad user moze przechodzic miedzy glownymi widokami systemu.
function AppSidebar({ currentRoute, onNavigate, authenticatedUser }) {
  const userRole = authenticatedUser?.role;

  const canSeeAdminRoles = userRole === "administrator" || userRole === "superadmin";

  return (
    <div
      className="border-end bg-white p-3 d-flex flex-column justify-content-between"
      style={{ width: "250px", minHeight: "calc(100vh - 73px)" }}
    >
      {/* Gorna czesc sidebara - glowna nawigacja */}
      <div>
        <div className="fw-bold text-uppercase text-muted small mb-3">
          Nawigacja
        </div>

        <Nav className="flex-column gap-2">
          {/* Przeglad / dashboard */}
          <SidebarButton
            label="Przegląd"
            isActive={currentRoute === "dashboard"}
            onClick={() => onNavigate("dashboard")}
          />

          {/* Projekty */}
          <SidebarButton
            label="Projekty"
            isActive={currentRoute === "projects"}
            onClick={() => onNavigate("projects")}
          />

          {/* Zadania */}
          <SidebarButton
            label="Zadania"
            isActive={currentRoute === "tasks"}
            onClick={() => onNavigate("tasks")}
          />

          {/* Lista userow */}
          <SidebarButton
            label="Użytkownicy"
            isActive={currentRoute === "users"}
            onClick={() => onNavigate("users")}
          />

          {/* Widok do zarzadzania rolami */}
          {canSeeAdminRoles && (
          <SidebarButton
            label="Zarządzanie rolami"
            isActive={currentRoute === "admin-roles"}
            onClick={() => onNavigate("admin-roles")}
          />
          )}
        </Nav>
      </div>

      {/* Dolna czesc sidebara - dodatkowe moduły */}
      <div>
        <div className="fw-bold text-uppercase text-muted small mb-3">
          Komunikacja
        </div>

        <Nav className="flex-column gap-2">
          {/* Czat */}
          <SidebarButton
            label="Czat"
            isActive={currentRoute === "chat"}
            onClick={() => onNavigate("chat")}
          />

          {/* Powiadomienia */}
          <SidebarButton
            label="Powiadomienia"
            isActive={currentRoute === "notifications"}
            onClick={() => onNavigate("notifications")}
          />
        </Nav>
      </div>
    </div>
  );
}

export default AppSidebar;