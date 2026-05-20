// Middleware do sprawdzania tokenu i roli.
// Wyciagniete do osobnego pliku, zeby nie zasmiecac server.js.

const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;

// straznik, sprawdza czy request ma token i czy jest on poprawny
// jak tak to idziemy dalej
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  // Jesli nie ma authorization
  if (!authHeader) {
    return res.status(401).json({
      message: "Brak nagłówka Authorization.",
    });
  }

  // Nagłówek Authorization powinien mieć format:
  // "Bearer TOKEN"
  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({
      message: "Nieprawidłowy format tokenu.",
    });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.auth = payload;
    next();
  } catch (error) {
    return res.status(401).json({
      message: "Token jest nieprawidłowy lub wygasł.",
    });
  }
}

// Dodatkowy middleware do sprawdzania roli.
// requireAuth sprawdza czy user ma poprawny token,
// a requireRole sprawdza czy ma odpowiednie uprawnienia.
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.auth || !req.auth.role) {
      return res.status(403).json({
        message: "Brak informacji o roli użytkownika.",
      });
    }

    if (!allowedRoles.includes(req.auth.role)) {
      return res.status(403).json({
        message: "Brak uprawnień do wykonania tej operacji.",
      });
    }

    next();
  };
}

module.exports = {
  requireAuth,
  requireRole,
};
