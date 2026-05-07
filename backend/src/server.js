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

// Tworzymy aplikację Express
const app = express();

// Ustawiamy port backendu z .env, a jeśli go nie ma, to domyślnie 5000
const PORT = process.env.BACKEND_PORT || 5000;

// Włączenie obsługi CORS
app.use(cors());

// Włączenie obsługi JSON w requestach
app.use(express.json());

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