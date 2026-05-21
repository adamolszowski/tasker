// Import biblioteki Express - odpowiada za tworzenie backendu i endpointów API
const express = require("express");

// Import CORS - pozwala frontendowi łączyć się z backendem z innego portu
const cors = require("cors");

// Wczytanie zmiennych środowiskowych z pliku .env
require("dotenv").config();

// Import bcryptjs - służy do hashowania haseł
const bcrypt = require("bcryptjs");

// Import JWT
const jwt = require("jsonwebtoken");

// Polaczenie z baza jest teraz osobno w db.js
const sequelize = require("./db");

// Middleware auth wyciagniete do osobnego pliku
const { requireAuth, requireRole } = require("./middleware/authMiddleware");

// Walidacje auth
const {
  validateRegisterInput,
  validateLoginInput,
  validateChangePasswordInput,
} = require("./validators/authValidators");

// Walidacje i helpery admina
const {
  validateApproveRoleInput,
  validateManageRoleInput,
  canManageTargetUser,
} = require("./validators/adminValidators");

// Zapytania do users wyciagniete do osobnego pliku
const {
  findUserByLogin,
  findUserByEmail,
  findUserWithRoleByLogin,
  findUserWithRoleById,
  findPendingUsers,
  findActiveUsers,
  findUsersForDirectory,
  findUserWithRoleByIdForAdmin,
  findUserSecurityById,
} = require("./data/userQueries");

// Trasy projektu sa wydzielone do osobnego pliku, zeby potem latwiej bylo to rozwijac
const projectRoutes = require("./routes/projectRoutes");

// Tworzymy aplikację Express
const app = express();

// Ustawiamy port backendu z .env, a jeśli go nie ma, to domyślnie 5000
const PORT = process.env.BACKEND_PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1d";

// Włączenie obsługi CORS
app.use(cors());

// Włączenie obsługi JSON w requestach
app.use(express.json());

// Generuje token JWT dla poprawnie zalogowanego usera.
// W tym tokenie zapisujemy podstawowe dane,
// ktore potem beda potrzebne do autoryzacji.
function generateAccessToken(user) {
  if (!JWT_SECRET) {
    throw new Error("Brakuje JWT_SECRET w pliku .env");
  }

  return jwt.sign(
    {
      sub: user.id,
      login: user.login,
      role: user.role_name,
    },
    JWT_SECRET,
    {
      expiresIn: JWT_EXPIRES_IN,
    }
  );
}

// Prosty endpoint testowy
app.get("/", (req, res) => {
  res.send("Backend Tasker działa.");
});

// Endpoint sprawdzający stan backendu i połączenie z bazą
app.get("/api/health", async (req, res) => {
  try {
    await sequelize.authenticate();

    res.json({
      status: "ok",
      service: "tasker-backend",
      database: "connected",
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      service: "tasker-backend",
      database: "disconnected",
      message: error.message,
    });
  }
});

// Endpoint testowy do pobrania statusów projektów z tabeli słownikowej
app.get("/api/project-statuses", async (req, res) => {
  try {
    const [rows] = await sequelize.query(`
      SELECT id, name
      FROM project_statuses
      ORDER BY id ASC
    `);

    res.json(rows);
  } catch (error) {
    res.status(500).json({
      message: "Błąd podczas pobierania statusów projektu.",
      error: error.message,
    });
  }
});

// Endpoint rejestracji nowego usera.
app.post("/api/auth/register", async (req, res) => {
  const validation = validateRegisterInput(req.body);

  if (validation.error) {
    return res.status(400).json({
      message: validation.error,
    });
  }

  const { login, password, firstName, lastName, email, phone } =
    validation.data;

  const transaction = await sequelize.transaction();

  try {
    const existingUser = await findUserByLogin(login, transaction);

    if (existingUser) {
      await transaction.rollback();
      return res.status(409).json({
        message: "Użytkownik o takim loginie już istnieje.",
      });
    }

    const existingEmail = await findUserByEmail(email, transaction);

    if (existingEmail) {
      await transaction.rollback();
      return res.status(409).json({
        message: "Użytkownik o takim adresie e-mail już istnieje.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const [insertedUsers] = await sequelize.query(
      `
      INSERT INTO users (
        login,
        password_hash,
        first_name,
        last_name,
        email,
        phone,
        role_id,
        approved_by_user_id,
        approved_at
      )
      VALUES (
        :login,
        :passwordHash,
        :firstName,
        :lastName,
        :email,
        :phone,
        NULL,
        NULL,
        NULL
      )
      RETURNING id, login, first_name, last_name, email, phone, role_id, approved_at, created_at
      `,
      {
        replacements: {
          login,
          passwordHash,
          firstName,
          lastName,
          email,
          phone,
        },
        transaction,
      }
    );

    await transaction.commit();

    return res.status(201).json({
      message:
        "Konto zostało utworzone i oczekuje na aktywację przez superadministratora.",
      user: insertedUsers[0],
    });
  } catch (error) {
    await transaction.rollback();

    return res.status(500).json({
      message: "Błąd podczas rejestracji użytkownika.",
      error: error.message,
    });
  }
});

// Endpoint logowania.
app.post("/api/auth/login", async (req, res) => {
  const validation = validateLoginInput(req.body);

  if (validation.error) {
    return res.status(400).json({
      message: validation.error,
    });
  }

  const { login, password } = validation.data;

  try {
    const user = await findUserWithRoleByLogin(login);

    if (!user) {
      return res.status(401).json({
        message: "Nieprawidłowy login lub hasło.",
      });
    }

    const passwordMatches = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatches) {
      return res.status(401).json({
        message: "Nieprawidłowy login lub hasło.",
      });
    }

    if (!user.role_id || !user.role_name) {
      return res.status(403).json({
        message: "Konto oczekuje na aktywację przez superadministratora.",
      });
    }

    const token = generateAccessToken(user);

    return res.status(200).json({
      message: "Logowanie poprawne.",
      token,
      user: {
        id: user.id,
        login: user.login,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        phone: user.phone,
        role: user.role_name,
        mustChangePassword: user.must_change_password,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Błąd podczas logowania użytkownika.",
      error: error.message,
    });
  }
});

// Endpoint do sprawdzania kto jest aktualnie zalogowany.
app.get("/api/auth/me", requireAuth, async (req, res) => {
  try {
    const user = await findUserWithRoleById(req.auth.sub);

    if (!user) {
      return res.status(404).json({
        message: "Użytkownik nie istnieje.",
      });
    }

    return res.status(200).json({
      user: {
        id: user.id,
        login: user.login,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        phone: user.phone,
        role: user.role_name,
        approvedAt: user.approved_at,
        mustChangePassword: user.must_change_password,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Błąd podczas pobierania danych użytkownika.",
      error: error.message,
    });
  }
});

// Lista userow oczekujacych na aktywacje.
app.get(
  "/api/admin/pending-users",
  requireAuth,
  requireRole("superadmin"),
  async (req, res) => {
    try {
      const users = await findPendingUsers();

      return res.status(200).json({
        users,
      });
    } catch (error) {
      return res.status(500).json({
        message: "Błąd podczas pobierania użytkowników oczekujących.",
        error: error.message,
      });
    }
  }
);

// Nadawanie roli nowemu userowi.
app.patch(
  "/api/admin/users/:id/approve-role",
  requireAuth,
  requireRole("superadmin"),
  async (req, res) => {
    const validation = validateApproveRoleInput(req.body);

    if (validation.error) {
      return res.status(400).json({
        message: validation.error,
      });
    }

    const userId = Number(req.params.id);
    const { role } = validation.data;

    if (!userId || Number.isNaN(userId)) {
      return res.status(400).json({
        message: "Nieprawidłowe ID użytkownika.",
      });
    }

    const transaction = await sequelize.transaction();

    try {
      const [targetUsers] = await sequelize.query(
        `
        SELECT id, login, role_id, approved_at
        FROM users
        WHERE id = :userId
        LIMIT 1
        `,
        {
          replacements: { userId },
          transaction,
        }
      );

      const targetUser = targetUsers[0];

      if (!targetUser) {
        await transaction.rollback();
        return res.status(404).json({
          message: "Użytkownik nie istnieje.",
        });
      }

      if (targetUser.role_id !== null) {
        await transaction.rollback();
        return res.status(409).json({
          message: "Ten użytkownik ma już przypisaną rolę.",
        });
      }

      const [updatedUsers] = await sequelize.query(
        `
        UPDATE users
        SET
          role_id = (SELECT id FROM roles WHERE name = :role),
          approved_by_user_id = :approvedByUserId,
          approved_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = :userId
        RETURNING id, login, role_id, approved_by_user_id, approved_at
        `,
        {
          replacements: {
            userId,
            role,
            approvedByUserId: req.auth.sub,
          },
          transaction,
        }
      );

      await transaction.commit();

      return res.status(200).json({
        message: "Rola została nadana użytkownikowi.",
        user: updatedUsers[0],
      });
    } catch (error) {
      await transaction.rollback();

      return res.status(500).json({
        message: "Błąd podczas nadawania roli użytkownikowi.",
        error: error.message,
      });
    }
  }
);

// Lista aktywnych userow.
app.get(
  "/api/admin/active-users",
  requireAuth,
  requireRole("administrator", "superadmin"),
  async (req, res) => {
    try {
      const users = await findActiveUsers();

      return res.status(200).json({
        users,
      });
    } catch (error) {
      return res.status(500).json({
        message: "Błąd podczas pobierania aktywnych użytkowników.",
        error: error.message,
      });
    }
  }
);

// Zmiana roli aktywnego usera.
app.patch(
  "/api/admin/users/:id/change-role",
  requireAuth,
  requireRole("administrator", "superadmin"),
  async (req, res) => {
    const validation = validateManageRoleInput(req.body);

    if (validation.error) {
      return res.status(400).json({
        message: validation.error,
      });
    }

    const userId = Number(req.params.id);
    const { role } = validation.data;

    if (!userId || Number.isNaN(userId)) {
      return res.status(400).json({
        message: "Nieprawidłowe ID użytkownika.",
      });
    }

    if (req.auth.sub === userId) {
      return res.status(409).json({
        message: "Nie można zmieniać własnej roli tym endpointem.",
      });
    }

    const transaction = await sequelize.transaction();

    try {
      const targetUser = await findUserWithRoleByIdForAdmin(
        userId,
        transaction
      );

      if (!targetUser) {
        await transaction.rollback();
        return res.status(404).json({
          message: "Użytkownik nie istnieje.",
        });
      }

      if (!targetUser.role_id || !targetUser.role_name) {
        await transaction.rollback();
        return res.status(409).json({
          message:
            "Ten użytkownik nie ma jeszcze przypisanej roli. Użyj aktywacji konta.",
        });
      }

      if (!canManageTargetUser(req.auth.role, targetUser.role_name)) {
        await transaction.rollback();
        return res.status(403).json({
          message: "Brak uprawnień do zmiany roli tego użytkownika.",
        });
      }

      if (targetUser.role_name === role) {
        await transaction.rollback();
        return res.status(409).json({
          message: "Użytkownik ma już przypisaną tę rolę.",
        });
      }

      const [updatedUsers] = await sequelize.query(
        `
        UPDATE users
        SET
          role_id = (SELECT id FROM roles WHERE name = :role),
          approved_by_user_id = :approvedByUserId,
          approved_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = :userId
        RETURNING id, login, role_id, approved_by_user_id, approved_at
        `,
        {
          replacements: {
            userId,
            role,
            approvedByUserId: req.auth.sub,
          },
          transaction,
        }
      );

      await transaction.commit();

      return res.status(200).json({
        message: "Rola użytkownika została zmieniona.",
        user: updatedUsers[0],
      });
    } catch (error) {
      await transaction.rollback();

      return res.status(500).json({
        message: "Błąd podczas zmiany roli użytkownika.",
        error: error.message,
      });
    }
  }
);

// Odbiera role userowi.
app.patch(
  "/api/admin/users/:id/revoke-role",
  requireAuth,
  requireRole("administrator", "superadmin"),
  async (req, res) => {
    const userId = Number(req.params.id);

    if (!userId || Number.isNaN(userId)) {
      return res.status(400).json({
        message: "Nieprawidłowe ID użytkownika.",
      });
    }

    if (req.auth.sub === userId) {
      return res.status(409).json({
        message: "Nie można odebrać własnej roli tym endpointem.",
      });
    }

    const transaction = await sequelize.transaction();

    try {
      const targetUser = await findUserWithRoleByIdForAdmin(
        userId,
        transaction
      );

      if (!targetUser) {
        await transaction.rollback();
        return res.status(404).json({
          message: "Użytkownik nie istnieje.",
        });
      }

      if (!targetUser.role_id || !targetUser.role_name) {
        await transaction.rollback();
        return res.status(409).json({
          message: "Ten użytkownik nie ma przypisanej roli.",
        });
      }

      if (!canManageTargetUser(req.auth.role, targetUser.role_name)) {
        await transaction.rollback();
        return res.status(403).json({
          message: "Brak uprawnień do odebrania roli temu użytkownikowi.",
        });
      }

      const [updatedUsers] = await sequelize.query(
        `
        UPDATE users
        SET
          role_id = NULL,
          approved_by_user_id = NULL,
          approved_at = NULL,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = :userId
        RETURNING id, login, role_id, approved_by_user_id, approved_at
        `,
        {
          replacements: { userId },
          transaction,
        }
      );

      await transaction.commit();

      return res.status(200).json({
        message: "Rola została odebrana użytkownikowi.",
        user: updatedUsers[0],
      });
    } catch (error) {
      await transaction.rollback();

      return res.status(500).json({
        message: "Błąd podczas odbierania roli użytkownikowi.",
        error: error.message,
      });
    }
  }
);

// Zwykla lista userow do widoku na froncie.
app.get(
  "/api/users",
  requireAuth,
  requireRole("pracownik", "kierownik", "administrator", "superadmin"),
  async (req, res) => {
    try {
      const users = await findUsersForDirectory();

      return res.status(200).json({
        users,
      });
    } catch (error) {
      return res.status(500).json({
        message: "Błąd podczas pobierania listy użytkowników.",
        error: error.message,
      });
    }
  }
);

// Zmiana hasla po pierwszym logowaniu albo normalnie z tokenem.
app.post("/api/auth/change-password", requireAuth, async (req, res) => {
  const validation = validateChangePasswordInput(req.body);

  if (validation.error) {
    return res.status(400).json({
      message: validation.error,
    });
  }

  const { currentPassword, newPassword } = validation.data;
  const transaction = await sequelize.transaction();

  try {
    const user = await findUserSecurityById(req.auth.sub, transaction);

    if (!user) {
      await transaction.rollback();
      return res.status(400).json({
        message: "Użytkownik nie istnieje",
      });
    }

    const passwordMatches = await bcrypt.compare(
      currentPassword,
      user.password_hash
    );

    if (!passwordMatches) {
      await transaction.rollback();
      return res.status(401).json({
        message: "Obecne hasło jest nieprawidłowe",
      });
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    await sequelize.query(
      `
      UPDATE users
      SET
        password_hash = :newPasswordHash,
        must_change_password = FALSE,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = :userId
      `,
      {
        replacements: {
          userId: user.id,
          newPasswordHash,
        },
        transaction,
      }
    );

    await transaction.commit();

    return res.status(200).json({
      message: "Hasło zostało zmienione.",
    });
  } catch (error) {
    await transaction.rollback();

    return res.status(500).json({
      message: "Blad podczas zmiany hasła.",
      error: error.message,
    });
  }
});

// Funkcja startowa backendu.
async function startServer() {
  try {
    await sequelize.authenticate();
    console.log("Połączenie z bazą danych działa.");

    app.listen(PORT, () => {
      console.log(`Backend działa na porcie ${PORT}`);
    });
  } catch (error) {
    console.error("Błąd podczas uruchamiania backendu:", error.message);
    process.exit(1);
  }
}

// Start backendu
startServer();
