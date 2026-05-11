import React, { useState } from "react";
import Card from "react-bootstrap/Card";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Alert from "react-bootstrap/Alert";
import Spinner from "react-bootstrap/Spinner";

// Adres backendu - tutaj wysyłamy dane logowania
const API_URL = "http://localhost:5000";

function LoginPage({ onLoginSuccess, onGoToRegister }) {
  // Stany pól formularza
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");

  // Komunikat błędu, np. złe hasło albo brak połączenia z backendem
  const [errorMessage, setErrorMessage] = useState("");

  // Flaga informująca, czy formularz właśnie się wysyła
  // Dzięki temu można zablokować pola i przycisk
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Funkcja uruchamia się po kliknięciu "Zaloguj"
  const handleSubmit = async (event) => {
    // Zatrzymujemy domyślne odświeżanie strony przez formularz
    event.preventDefault();

    // Czyścimy stary komunikat błędu przed nową próbą logowania
    setErrorMessage("");

    // Prosta walidacja po stronie frontu:
    // oba pola muszą być uzupełnione
    if (!login.trim() || !password.trim()) {
      setErrorMessage("Uzupełnij login i hasło.");
      return;
    }

    try {
        // Ustawiamy stan "trwa wysylanie"
        setIsSubmitting(true);

        // Wysylamy dane logowania do backendu
        const response = await fetch(`${API_URL}/api/auth/login`, {
            method: "POST",
            headers: {
                // Mówimy backendowi, że wysyłamy JSON
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                // trim() usuwa spacje z początku i końca
                login: login.trim(),
                password: password.trim(),
            }),
        });

        // Odczytujemy odpowiedź backendu jako JSON
        const data = await response.json();

        // Jeśli backend zwrócił błąd, pokazujemy komunikat
        if (!response.ok) {
            setErrorMessage(data.message || "Wystąpił błąd podczas logowania.");
            return;
        }

        // Jeśli logowanie się udało,
        // przekazujemy wynik wyżej do App.jsx
        // Tam później zapiszemy token i usera
        if (onLoginSuccess) {
            onLoginSuccess(data);
        }
    } catch (error) {
      // Jeśli frontend nie może połączyć się z backendem
      setErrorMessage("Nie udało się połączyć z backendem.");
    } finally {
      // Niezależnie od wyniku kończymy stan wysyłania
      setIsSubmitting(false);
    }
  };

  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100">
      <Card style={{ width: "420px" }}>
        <Card.Body>
          <Card.Title className="text-center mb-4">TASKER</Card.Title>

          {/* Jeśli jest błąd, pokazujemy czerwony alert */}
          {errorMessage && (
            <Alert variant="danger" className="mb-3">
              {errorMessage}
            </Alert>
          )}

          {/* Formularz logowania */}
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Login</Form.Label>
              <Form.Control
                type="text"
                placeholder="Wpisz login"
                value={login}
                onChange={(event) => setLogin(event.target.value)}
                disabled={isSubmitting}
              />
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label>Hasło</Form.Label>
              <Form.Control
                type="password"
                placeholder="Wpisz hasło"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={isSubmitting}
              />
            </Form.Group>

            {/* Główny przycisk wysyłający formularz */}
            <Button
              type="submit"
              variant="primary"
              className="w-100 mb-3"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  {/* Spinner pokazuje, że trwa logowanie */}
                  <Spinner size="sm" className="me-2" />
                  Logowanie...
                </>
              ) : (
                "Zaloguj"
              )}
            </Button>
          </Form>

          {/* Przejście do strony rejestracji */}
          <div className="text-center">
            <Button
              variant="link"
              onClick={onGoToRegister}
              disabled={isSubmitting}
            >
              Nie masz konta? Zarejestruj się
            </Button>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
}

export default LoginPage;