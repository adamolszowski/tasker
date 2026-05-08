// Import biblioteki Express - odpowiada za tworzenie backendu i endpointów API
const express = require("express");

// Import CORS - pozwala frontendowi łączyć się z backendem z innego portu
const cors = require("cors");

// Wczytanie zmiennych środowiskowych z pliku .env
require("dotenv").config();

// Import Sequelize - biblioteka do połączenia z PostgreSQL
const { Sequelize } = require("sequelize");

// Import bcryptjs - służy do hashowania haseł
const bcrypt = require("bcryptjs");

// Import JWT
const jwt = require("jsonwebtoken");

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

function normalizeOptionalField(value) {
  // Jeśli wartość nie jest tekstem, zwracamy null
  if (typeof value !== "string") {
    return null;
  }

  // Usuwamy spacje z początku i końca
  const trimmed = value.trim();

  // Jeśli po obcięciu spacji pole jest puste, zapisujemy null
  return trimmed === "" ? null : trimmed;
}

async function findUserByLogin(login, transaction = null) {
  // Szukamy użytkownika po loginie.
  // transaction jest opcjonalne — jeśli zostanie przekazane,
  // zapytanie wykona się w ramach tej transakcji.
  const [rows] = await sequelize.query(
    `
    SELECT *
    FROM users
    WHERE login = :login
    LIMIT 1
    `,
    {
      // Bezpieczne podstawienie wartości login do zapytania SQL.
      replacements: { login },

      // Opcjonalna transakcja Sequelize.
      transaction,
    }
  );

  // Zwracamy pierwszego użytkownika albo null, jeśli nie istnieje.
  return rows[0] || null;
}

async function findUserByEmail(email, transaction = null) {
  // Jeśli e-maila nie podano, nie ma sensu sprawdzać
  if (!email) {
    return null;
  }

  const [rows] = await sequelize.query(
    `
    SELECT *
    FROM users
    WHERE email = :email
    LIMIT 1
    `,
    {
      replacements: { email: email, }, // przedluzony zapis
      transaction,
    }
  );

  return rows[0] || null;
}

async function findUserWithRoleByLogin(login) {
  const [rows] = await sequelize.query(
    `
    SELECT
      u.id,
      u.login,
      u.password_hash,
      u.first_name,
      u.last_name,
      u.email,
      u.phone,
      u.role_id,
      u.approved_at,
      r.name AS role_name
    FROM users u
    LEFT JOIN roles r ON r.id = u.role_id
    WHERE u.login = :login
    LIMIT 1
    `,
    {
      replacements: { login },
    }
  );

  return rows[0] || null;
}

async function findUserWithRoleById(userId) {
  const [rows] = await sequelize.query(
    `
    SELECT
      u.id,
      u.login,
      u.first_name,
      u.last_name,
      u.email,
      u.phone,
      u.role_id,
      u.approved_at,
      r.name AS role_name
    FROM users u
    LEFT JOIN roles r ON r.id = u.role_id
    WHERE u.id = :userId
    LIMIT 1
    `,
    {
      replacements: { userId },
    }
  );

  return rows[0] || null;
}

function validateRegisterInput(body) {
  // login i hasło są wymagane,
  // dlatego jeśli pole nie jest tekstem, ustawiamy pusty string.
  // Dzięki temu później łatwo sprawdzić, czy user coś podał.
  const login = typeof body.login === "string" ? body.login.trim() : "";
  const password = typeof body.password === "string" ? body.password.trim() : "";

  // pola opcjonalne normalizujemy funkcją pomocniczą:
  // jeśli pole jest puste, zapisze się null,
  // jeśli zawiera tekst, zostanie on przycięty
  const firstName = normalizeOptionalField(body.firstName);
  const lastName = normalizeOptionalField(body.lastName);
  const email = normalizeOptionalField(body.email);
  const phone = normalizeOptionalField(body.phone);

  // Walidacja wymaganych pól
  if (!login) {
    return { error: "Login jest wymagany." };
  }

  if (!password) {
    return { error: "Hasło jest wymagane." };
  }

  // Proste minimalne zasady
  if (login.length < 3) {
    return { error: "Login musi mieć co najmniej 3 znaki." };
  }

  if (password.length < 6) {
    return { error: "Hasło musi mieć co najmniej 6 znaków." };
  }

  // Jeśli wszystko jest okej, zwracamy przygotowane dane
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

function validateLoginInput(body) {
  // login i hasło są wymagane
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

function generateAccessToken(user) {
  if (!JWT_SECRET) {
    throw new Error("Brakuje JWT_SECRET w pliku .env");
  }

  //genrujemy token
  return jwt.sign(
    {
      sub: user.id, //id uzytkownika
      login: user.login, //jaki ten user ma login
      role: user.role_name, // jaka ten user ma role
    },
    JWT_SECRET,
    {
      expiresIn: JWT_EXPIRES_IN, // kiedy wygasa
    }
  );
}

//straznik, sprawdza czy request ma token i czy jest on poprawny
//jak tak to idziemy dalej
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  //Jesli nie ma authorization
  if (!authHeader) {
    return res.status(401).json({
      message: "Brak nagłówka Authorization",
    });
  }

  // Nagłówek Authorization powinien mieć format:
  // "Bearer TOKEN"
  // split(" ") dzieli tekst na dwie części:
  // [ "Bearer", "TOKEN" ]
  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({
      message: "Nieprawidłowy format tokenu.",
    });
  }

  try {
    // jwt.verify(...) sprawdza, czy token jest poprawny,
    // czy został podpisany właściwym sekretem
    // i czy nie wygasł.
    // Jeśli wszystko jest okej, zwraca payload zapisany w tokenie.
    const payload = jwt.verify(token, JWT_SECRET);
    // Zapisujemy dane z tokenu do req.auth,
    // żeby kolejne middleware i endpointy mogły z nich korzystać.
    req.auth = payload;
    // next() przekazuje obsługę requestu dalej,
    // do następnego middleware albo właściwego endpointu.
    next();
  } catch (error) {
    return res.status(401).json({
      message: "Token jest nieprawidłowy lub wygasł.",
    });
  }
}

// Tworzymy połączenie z bazą danych PostgreSQL przez Sequelize
const sequelize = new Sequelize(
  process.env.POSTGRES_DB,       // nazwa bazy danych
  process.env.POSTGRES_USER,     // użytkownik bazy
  process.env.POSTGRES_PASSWORD, // hasło do bazy
  {
    host: process.env.DB_HOST || "postgres", // host bazy, zwykle nazwa kontenera
    port: Number(process.env.DB_PORT || 5432), // port PostgreSQL
    dialect: "postgres", // typ bazy danych
    logging: false, // wyłącza logowanie zapytań SQL w konsoli
  }
);

// Funkcja sprawdza, czy w bazie istnieje już konto superadmina.
// Jeśli nie istnieje - tworzy je automatycznie na podstawie danych z .env.
// async oznacza, że funkcja działa asynchronicznie,
// może używać await i zwraca Promise.
// Dzięki temu JavaScript może poczekać na wynik operacji,
// np. zapytania do bazy, bez blokowania dalszego działania aplikacji.
async function ensureSuperadmin() {
  // Rozpoczynamy transakcję - dzięki temu albo wszystko się zapisze,
  // albo w razie błędu nic nie zostanie częściowo zapisane.
  // await -> poczekaj, aż Sequelize utworzy transakcję, 
  // i dopiero wtedy zapisz wynik do transaction, dzieki temu
  // zamiast obietnicy mamy pewnosc ze poczekamy na wynik
  const transaction = await sequelize.transaction();

  try {
    // Sprawdzamy, czy istnieje już użytkownik z rolą "superadmin"
    // sequelize.query(...) zwraca tablicę, a jej pierwszy element
    // to lista wierszy zwróconych przez zapytanie SQL
    const [existingSuperadmin] = await sequelize.query(
      `
      SELECT u.id
      FROM users u
      JOIN roles r ON r.id = u.role_id
      WHERE r.name = 'superadmin'
      LIMIT 1
      `,
      { transaction: transaction } // to zapytanie ma byc wykonane w ramach transakcji
      // czyli mamy bezpieczne zapytanie, skrocony zapis to bylby { transaction }
    );

    // Jeśli superadmin już istnieje, zatwierdzamy transakcję i kończymy funkcję
    // jeśli zapytanie zwróciło co najmniej 1 wiersz,
    // to znaczy, że superadmin już istnieje
    if (existingSuperadmin.length > 0) {
      await transaction.commit();
      console.log("Superadmin już istnieje - pomijam tworzenie.");
      return;
    }

    // Pobieramy dane superadmina z pliku .env
    const superadminLogin = process.env.SUPERADMIN_LOGIN;
    const superadminPassword = process.env.SUPERADMIN_PASSWORD;
    const superadminFirstName = process.env.SUPERADMIN_FIRST_NAME || "Super";
    const superadminLastName = process.env.SUPERADMIN_LAST_NAME || "Admin";
    const superadminEmail = process.env.SUPERADMIN_EMAIL || null;
    const superadminPhone = process.env.SUPERADMIN_PHONE || null;

    // Jeśli brakuje loginu lub hasła w .env, rzucamy błąd
    // dzieki temu ze to robimy, w funkcji start server jest on widoczny,
    // po prostu przekazujemy go dalej - funkcja zwraca ten blad
    if (!superadminLogin || !superadminPassword) {
      throw new Error(
        "Brakuje SUPERADMIN_LOGIN lub SUPERADMIN_PASSWORD w pliku .env"
      );
    }

    // Hashujemy hasło superadmina
    const passwordHash = await bcrypt.hash(superadminPassword, 10);

    // Dodajemy superadmina do tabeli users
    await sequelize.query(
      `
      INSERT INTO users (
        login,
        password_hash,
        first_name,
        last_name,
        email,
        phone,
        role_id,
        approved_at
      )
      VALUES (
        :login,
        :passwordHash,
        :firstName,
        :lastName,
        :email,
        :phone,
        (SELECT id FROM roles WHERE name = 'superadmin'),
        CURRENT_TIMESTAMP
      )
      `,
      {
        replacements: {
          login: superadminLogin,
          passwordHash,
          firstName: superadminFirstName,
          lastName: superadminLastName,
          email: superadminEmail,
          phone: superadminPhone,
        },
        transaction, // skrocony zapis
      }
    );

    // Jeśli wszystko się udało - zatwierdzamy transakcję
    await transaction.commit();
    console.log("Superadmin został utworzony.");
  } catch (error) {
    // Jeśli był błąd - cofamy wszystkie zmiany w transakcji
    await transaction.rollback();
    throw error;
  }
}

// Prosty endpoint testowy
app.get("/", (req, res) => {
  res.send("Backend Tasker działa.");
});

// Endpoint sprawdzający stan backendu i połączenie z bazą
app.get("/api/health", async (req, res) => {
  try {
    // Sprawdzamy, czy połączenie z bazą działa
    await sequelize.authenticate();

    // Jeśli działa - zwracamy status OK
    res.json({
      status: "ok",
      service: "tasker-backend",
      database: "connected",
    });
  } catch (error) {
    // Jeśli nie działa - zwracamy błąd 500
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

    // Zwracamy listę statusów
    res.json(rows);
  } catch (error) {
    // Obsługa błędu przy pobieraniu statusów
    res.status(500).json({
      message: "Błąd podczas pobierania statusów projektu.",
      error: error.message,
    });
  }
});

app.post("/api/auth/register", async (req, res) => {
  // Najpierw walidujemy dane z requestu
  const validation = validateRegisterInput(req.body);
  
  // Jeśli walidacja zwróciła błąd, kończymy od razu
  if (validation.error) {
    return res.status(400).json({
      message: validation.error,
    });
  }

  // Destrukturyzacja obiektu validation.data.
  // Wyciągamy z niego poszczególne pola do osobnych zmiennych.
  const { login, password, firstName, lastName, email, phone } = validation.data;
  
  const transaction = await sequelize.transaction();

  try {
    // Sprawdzamy, czy login już istnieje
    const existingUser = await findUserByLogin(login, transaction);

    if (existingUser) {
      await transaction.rollback();
      return res.status(409).json({
        message: "Użytkownik o takim loginie już istnieje.",
      });
    }

    // Sprawdzamy, czy e-mail już istnieje
    const existingEmail = await findUserByEmail(email, transaction);

    if (existingEmail) {
      await transaction.rollback();
      return res.status(409).json({
        message: "Użytkownik o takim adresie e-mail już istnieje.",
      });
    }

    // Hashujemy hasło przed zapisem do bazy
    const passwordHash = await bcrypt.hash(password, 10);

    // sequelize.query(...) zwraca tablicę.
    // Pierwszy element tej tablicy to rekordy zwrócone przez RETURNING.
    // Ponieważ dodajemy jednego użytkownika, insertedUsers będzie tablicą
    // zawierającą jeden obiekt - nowo utworzone konto.
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

    // Zatwierdzamy transakcję
    await transaction.commit();

    // Zwracamy sukces
    return res.status(201).json({
      message:
        "Konto zostało utworzone i oczekuje na aktywację przez superadministratora.",
      user: insertedUsers[0],
    });
  } catch (error) {
    // Jeśli coś się wywali, cofamy transakcję
    await transaction.rollback();

    return res.status(500).json({
      message: "Błąd podczas rejestracji użytkownika.",
      error: error.message,
    });
  }
  
});

app.post("/api/auth/login", async (req, res) => {
  // Najpierw walidujemy dane logowania
  const validation = validateLoginInput(req.body);

  if (validation.error) {
    return res.status(400).json({
      message: validation.error,
    });
  }

  // Wyciągamy login i hasło z obiektu validation.data
  const { login, password } = validation.data;

  try {
    // Szukamy użytkownika po loginie razem z rolą
    const user = await findUserWithRoleByLogin(login);

    // Jeśli nie znalezniono usera, zwracamy błąd logowania
    if (!user) {
      return res.status(401).json({
        message: "Nieprawidłowy login lub hasło.",
      })
    }

    // Porównujemy hasło wpisane przez użytkownika z hashem z bazy
    const passwordMatches = await bcrypt.compare(password, user.password_hash);

    // Jeśli hasło się nie zgadza, zwracamy błąd logowania
    if (!passwordMatches) {
      return res.status(401).json({
        message: "Nieprawidłowy login lub hasło.",
      });
    }

    // Jeśli konto nie ma jeszcze roli, to znaczy, że czeka na aktywację
    if (!user.role_id || !user.role_name) {
      return res.status(403).json({
        message: "Konto oczekuje na aktywację przez superadministratora.",
      });
    }

    // Generujemy token JWT dla poprawnie zalogowanego uzytkownika
    const token = generateAccessToken(user);

    // Jeśli wszystko jest poprawne to zwracamy dane uzytkownika + sukces + token
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
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Błąd podczas logowania użytkownika.",
      error: error.message,
    });
  }
});

app.get("/api/auth/me", requireAuth, async (req, res) => {
  try {
    // req.auth.sub pochodzi z tokenu JWT czyli pobieramy id uzytkownika
    // z tokenu
    const user = await findUserWithRoleById(req.auth.sub);

    if (!user) {
      return res.status(404).json({
        message: "Użytkownik nie istnieje.",
      });
    }
    
    // zwracamy dane dla tego uzytkownika bo beda potrzebne dla frontendu
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
      },
    });

  } catch (error) {
    return res.status(500).json({
      message: "Błąd podczas pobierania danych użytkownika.",
      error: error.message,
    });
  }
});

// Funkcja uruchamiająca backend
async function startServer() {
  try {
    // Sprawdzamy połączenie z bazą
    await sequelize.authenticate();
    console.log("Połączenie z bazą danych działa.");

    // Upewniamy się, że superadmin istnieje
    await ensureSuperadmin();

    // Uruchamiamy serwer Express na wskazanym porcie
    app.listen(PORT, () => {
      console.log(`Backend działa na porcie ${PORT}`);
    });
  } catch (error) {
    // Jeśli backend nie wystartuje - wypisujemy błąd i kończymy proces
    console.error("Błąd podczas uruchamiania backendu:", error.message);
    process.exit(1);
  }
}

// Start backendu
startServer();