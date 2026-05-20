// Walidacje i helpery zwiazane z rolami i administracja.

const ALLOWED_APPROVAL_ROLES = ["pracownik", "kierownik", "administrator"];
const MANAGEABLE_ROLES = ["pracownik", "kierownik", "administrator"];

// Sprawdza czy przy aktywacji nowego konta
// backend dostal poprawna role.
function validateApproveRoleInput(body) {
  const role = typeof body.role === "string" ? body.role.trim() : "";

  if (!role) {
    return { error: "Rola jest wymagana." };
  }

  if (!ALLOWED_APPROVAL_ROLES.includes(role)) {
    return {
      error:
        "Nieprawidłowa rola. Dozwolone: pracownik, kierownik, administrator.",
    };
  }

  return {
    data: { role },
  };
}

// Walidacja nowej roli przy zmianie roli istniejacego usera.
function validateManageRoleInput(body) {
  const role = typeof body.role === "string" ? body.role.trim() : "";

  if (!role) {
    return { error: "Rola jest wymagana." };
  }

  if (!MANAGEABLE_ROLES.includes(role)) {
    return {
      error:
        "Nieprawidłowa rola. Dozwolone: pracownik, kierownik, administrator.",
    };
  }

  return {
    data: { role },
  };
}

// Tu jest glowna zasada biznesowa dla zarzadzania rolami.
function canManageTargetUser(actorRole, targetRole) {
  if (actorRole === "superadmin") {
    return targetRole !== "superadmin";
  }

  if (actorRole === "administrator") {
    return targetRole !== "administrator" && targetRole !== "superadmin";
  }

  return false;
}

module.exports = {
  ALLOWED_APPROVAL_ROLES,
  MANAGEABLE_ROLES,
  validateApproveRoleInput,
  validateManageRoleInput,
  canManageTargetUser,
};
