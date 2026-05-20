// Plik do polaczenia z baza danych.
// Trzymamy to osobno, zeby server.js byl krotszy i czytelniejszy.

const { Sequelize } = require("sequelize");

// Tworzymy polaczenie z PostgreSQL przez Sequelize
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

module.exports = sequelize;
