// Wszystkie zapytania do users wrzucone do jednego pliku.
// Nazwa jest prosta, po studencku - po prostu queries do userow.

const sequelize = require("../db");

// Szuka jednego usera po loginie.
async function findUserByLogin(login, transaction = null) {
  const [rows] = await sequelize.query(
    `
    SELECT *
    FROM users
    WHERE login = :login
    LIMIT 1
    `,
    {
      replacements: { login },
      transaction,
    }
  );

  return rows[0] || null;
}

// Szuka usera po adresie e-mail.
async function findUserByEmail(email, transaction = null) {
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
      replacements: { email },
      transaction,
    }
  );

  return rows[0] || null;
}

// Pobiera usera po loginie razem z jego rola.
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
      u.must_change_password,
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

// Pobiera usera po jego ID razem z rola.
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
      r.name AS role_name,
      u.must_change_password
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

// Pobiera liste userow, ktorzy nie maja jeszcze roli.
async function findPendingUsers() {
  const [rows] = await sequelize.query(
    `
    SELECT
      id,
      login,
      first_name,
      last_name,
      email,
      phone,
      role_id,
      approved_by_user_id,
      approved_at,
      created_at
    FROM users
    WHERE role_id IS NULL
    ORDER BY created_at ASC
    `
  );

  return rows;
}

// Pobiera liste aktywnych userow.
async function findActiveUsers() {
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
      u.approved_by_user_id,
      u.approved_at,
      u.created_at,
      r.name AS role_name
    FROM users u
    JOIN roles r ON r.id = u.role_id
    ORDER BY u.created_at ASC
    `
  );

  return rows;
}

// Zwykla lista userow do widoku "Uzytkownicy".
async function findUsersForDirectory() {
  const [rows] = await sequelize.query(
    `
    SELECT
      u.id,
      u.first_name,
      u.last_name,
      u.email,
      u.phone,
      r.name AS role_name
    FROM users u
    JOIN roles r ON r.id = u.role_id
    ORDER BY u.last_name ASC NULLS LAST, u.first_name ASC NULLS LAST, u.id ASC
    `
  );

  return rows;
}

// Pobiera konkretnego usera po ID razem z rola.
async function findUserWithRoleByIdForAdmin(userId, transaction = null) {
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
      u.approved_by_user_id,
      u.approved_at,
      u.created_at,
      u.must_change_password,
      r.name AS role_name
    FROM users u
    LEFT JOIN roles r ON r.id = u.role_id
    WHERE u.id = :userId
    LIMIT 1
    `,
    {
      replacements: { userId },
      transaction,
    }
  );

  return rows[0] || null;
}

async function findUserSecurityById(userId, transaction = null) {
  const [rows] = await sequelize.query(
    `
    SELECT
      id,
      login,
      password_hash,
      must_change_password
    FROM users
    WHERE id = :userId
    LIMIT 1
    `,
    {
      replacements: { userId },
      transaction,
    }
  );

  return rows[0] || null;
}

module.exports = {
  findUserByLogin,
  findUserByEmail,
  findUserWithRoleByLogin,
  findUserWithRoleById,
  findPendingUsers,
  findActiveUsers,
  findUsersForDirectory,
  findUserWithRoleByIdForAdmin,
  findUserSecurityById,
};
