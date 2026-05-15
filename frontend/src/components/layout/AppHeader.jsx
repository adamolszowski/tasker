import React from "react";
import Navbar from "react-bootstrap/Navbar";
import Container from "react-bootstrap/Container";
import Button from "react-bootstrap/Button";
import Badge from "react-bootstrap/Badge";

// Gorny pasek aplikacji.
// Pokazuje nazwe systemu, date, dane zalogowanego usera
// oraz przycisk do wylogowania.
function AppHeader({ currentUser, onLogout }) {
  // Bierzemy aktualna date w polskim formacie
  const now = new Date().toLocaleDateString("pl-PL");

  return (
    <Navbar bg="white" className="border-bottom px-4 py-3">
      <Container
        fluid
        className="p-0 d-flex justify-content-between align-items-center"
      >
        {/* Lewa strona headera */}
        <div className="d-flex align-items-center gap-3">
          {/* Proste logo / nazwa aplikacji */}
          <div
            className="border px-3 py-2 fw-bold"
            style={{ minWidth: "120px", textAlign: "center" }}
          >
            TASKER
          </div>

          {/* Znacznik z aktualna data */}
          <Badge
            bg="light"
            text="dark"
            className="border px-3 py-2 fw-normal"
          >
            {now}
          </Badge>
        </div>

        {/* Prawa strona headera */}
        <div className="d-flex align-items-center gap-3">
          {/* Box z podstawowymi danymi aktualnego usera */}
          <div className="border px-3 py-2 d-flex align-items-center gap-3">
            {/* Inicjaly usera - taki prosty "avatar" tekstowy */}
            <div
              className="border d-flex align-items-center justify-content-center"
              style={{ width: "36px", height: "36px", fontWeight: "bold" }}
            >
              {currentUser.initials}
            </div>

            {/* Imie / nazwisko oraz rola */}
            <div>
              <div className="fw-semibold">{currentUser.name}</div>
              <div className="text-muted small">{currentUser.roleLabel}</div>
            </div>
          </div>

          {/* Przycisk wylogowania - wywoluje funkcje przekazana z App.jsx */}
          <Button variant="outline-dark" onClick={onLogout}>
            Wyloguj
          </Button>
        </div>
      </Container>
    </Navbar>
  );
}

export default AppHeader;