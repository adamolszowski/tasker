export const ROLES = {
GUEST: "guest",
PRACOWNIK: "pracownik",
KIEROWNIK: "kierownik",
ADMINISTRATOR: "administrator",
SUPERADMIN: "superadministrator",
};

export const APP_ROUTES = [
{
    id: "login",
    label: "Logowanie",
    roles: [ROLES.GUEST]
},
{
    id: "register",
    label: "Rejestracja",
    roles: [ROLES.GUEST],
},
{
    id: "dashboard",
    label: "Przegląd",
    roles: [
      ROLES.PRACOWNIK,
      ROLES.KIEROWNIK,
      ROLES.ADMINISTRATOR,
      ROLES.SUPERADMIN,
    ],
},
{
    id: "projects",
    label: "Projekty",
    roles: [
      ROLES.PRACOWNIK,
      ROLES.KIEROWNIK,
      ROLES.ADMINISTRATOR,
      ROLES.SUPERADMIN,
    ],
},
 {
    id: "task",
    label: "Zadania",
    roles: [
      ROLES.PRACOWNIK,
      ROLES.KIEROWNIK,
      ROLES.ADMINISTRATOR,
      ROLES.SUPERADMIN,
    ],
  },
  {
    id: "users",
    label: "Użytkownicy",
    roles: [
      ROLES.PRACOWNIK,
      ROLES.KIEROWNIK,
      ROLES.ADMINISTRATOR,
      ROLES.SUPERADMIN,
    ],
},
{
    id: "chat",
    label: "Czat",
    roles: [
      ROLES.PRACOWNIK,
      ROLES.KIEROWNIK,
      ROLES.ADMINISTRATOR,
      ROLES.SUPERADMIN,
    ],
},
{
    id: "notifications",
    label: "Powiadomienia",
    roles: [
      ROLES.PRACOWNIK,
      ROLES.KIEROWNIK,
      ROLES.ADMINISTRATOR,
      ROLES.SUPERADMIN,
    ],
},
{
    id: "admin-roles",
    label: "Zarządzanie rolami",
    roles: [ROLES.ADMINISTRATOR, ROLES.SUPERADMIN],
},
];