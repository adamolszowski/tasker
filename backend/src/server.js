const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { Sequelize } = require("sequelize");

const app = express();
const PORT = process.env.BACKEND_PORT || 5000;

app.use(cors());
app.use(express.json());

const sequelize = new Sequelize(
  process.env.POSTGRES_DB,
  process.env.POSTGRES_USER,
  process.env.POSTGRES_PASSWORD,
  {
    host: process.env.DB_HOST || "postgres",
    port: Number(process.env.DB_PORT || 5432),
    dialect: "postgres",
    logging: false,
  }
);

app.get("/", (req, res) => {
  res.send("Backend Tasker działa.");
});

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

app.listen(PORT, () => {
  console.log(`Backend działa na porcie ${PORT}`);
});