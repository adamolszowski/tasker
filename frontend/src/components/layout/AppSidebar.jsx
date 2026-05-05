import React from "react";
import Button from "react-bootstrap/Button";
import Badge from "react-bootstrap/Badge";

function SidebarButton({ label, isActive, onClick, badge}) {
    return (
        <Button
        variant={isActive ? "dark" : "outline-secondary"}
        className="w-100 d-flex justify-content-between align-items-center text-start"
        onClick={onClick}
        >
            <span>{label}</span>
            {badge !== undefined && (
                <Badge bg="light" text="dark">
                    {badge}
                </Badge>
            )}
            </Button>
    );
}
    
function AppSidebar({ currentRoute, onNavigate }) {
    return (
     <div
      className="border-end bg-white d-flex flex-column justify-content-between p-3"
     style={{ width: "200px", minHeight: "calc(100vh - 89px)" }}
     >
        <div className="d-flex flex-column gap-2">
            <SidebarButton
            label="Przegląd"
            isActive={currentRoute === "dashboard"}
            onClick={() => onNavigate("dashboard")}
      />

            <SidebarButton
            label="Projekty"
            isActive={currentRoute === "projects"}
            onClick={() => onNavigate("projects")}
      />

       <SidebarButton
            label="Zadania"
            isActive={currentRoute === "tasks"}
            onClick={() => onNavigate("tasks")}
      />

       <SidebarButton
            label="Użytkownicy"
            isActive={currentRoute === "users"}
            onClick={() => onNavigate("users")}
      />
      </div>

      <div className="d-flex flex-column gap-2 pt-4 border-top">
         <SidebarButton
            label="Czat"
            badge={3}
            isActive={currentRoute === "chat"}
            onClick={() => onNavigate("chat")}
      />
    
     <SidebarButton
            label="Powiadomienia"
            badge={2}
            isActive={currentRoute === "notifications"}
            onClick={() => onNavigate("notifications")}
      />
 </div>
</div>
    );
}

export default AppSidebar;
