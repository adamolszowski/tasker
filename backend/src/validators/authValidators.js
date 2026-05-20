// Walidacje zwiazane z logowaniem, rejestracja i zmiana hasla.

// Prosta funkcja pomocnicza do pol opcjonalnych.
// Jak user nic nie poda albo poda cos co nie jest tekstem,
// to zwracamy null.
// Jak poda tekst, to obcinamy spacje z poczatku i konca.
function normalizeOptionalField(value) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

// Walidacja danych z formularza rejestracji.
function validateRegisterInput(body) {
  const login = typeof body.login === "string" ? body.login.trim() : "";
  const password = typeof body.password === "string" ? body.password.trim() : "";

  const firstName = normalizeOptionalField(body.firstName);
  const lastName = normalizeOptionalField(body.lastName);
  const email = normalizeOptionalField(body.email);
  const phone = normalizeOptionalField(body.phone);

  if (!login) {
    return { error: "Login jest wymagany." };
  }

  if (!password) {
    return { error: "Hasło jest wymagane." };
  }

  if (login.length < 3) {
    return { error: "Login musi mieć co najmniej 3 znaki." };
  }

  if (password.length < 6) {
    return { error: "Hasło musi mieć co najmniej 6 znaków." };
  }

  return {
    data: {
      login,
      password,
      firstName,
      lastName,
      email,
      phone,
    },
  };
}

// Walidacja danych logowania.
function validateLoginInput(body) {
  const login = typeof body.login === "string" ? body.login.trim() : "";
  const password = typeof body.password === "string" ? body.password.trim() : "";

  if (!login) {
    return { error: "Login jest wymagany." };
  }

  if (!password) {
    return { error: "Hasło jest wymagane." };
  }

  return {
    data: {
      login,
      password,
    },
  };
}

// Walidacja zmiany hasla.
function validateChangePasswordInput(body) {
  const currentPassword =
    typeof body.currentPassword === "string" ? body.currentPassword.trim() : "";
  const newPassword =
    typeof body.newPassword === "string" ? body.newPassword.trim() : "";

  if (!currentPassword) {
    return {
      error: "Obecne hasło jest wymagane.",
    };
  }

  if (!newPassword) {
    return {
      error: "Nowe hasło jest wymagane.",
    };
  }

  if (newPassword.length < 6) {
    return {
      error: "Nowe hasło musi mieć co najmniej 6 znaków.",
    };
  }

  if (currentPassword === newPassword) {
    return {
      error: "Hasla nie moga byc takie same.",
    };
  }

  return {
    data: {
      currentPassword,
      newPassword,
    },
  };
}

module.exports = {
  normalizeOptionalField,
  validateRegisterInput,
  validateLoginInput,
  validateChangePasswordInput,
};
