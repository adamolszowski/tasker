import React, { useState } from "react";
import Card from "react-bootstrap/Card";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Alert from "react-bootstrap/Alert";
import Spinner from "react-bootstrap/Spinner";

// Adres backendu - tutaj wysyłamy formularz rejestracji
const API_URL = "http://localhost:5000";

function RegisterPage({ onGoToLogin }) {
  // Stany dla pól formularza
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // Komunikaty dla użytkownika
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Informacja, czy formularz jest właśnie wysyłany
  // dzięki temu można zablokować przycisk i pola
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Czyści stare komunikaty błędu i sukcesu
  const resetMessages = () => {
    setErrorMessage("");
    setSuccessMessage("");
  };

  // Czyści cały formularz po poprawnej rejestracji
  const resetForm = () => {
    setLogin("");
    setPassword("");
    setRepeatPassword("");
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhone("");
  };

    // Obsługa wysłania formularza:
    // 1. zatrzymujemy odświeżenie strony
    // 2. robimy prostą walidację na froncie
    // 3. wysyłamy dane do backendu
    // 4. pokazujemy sukces albo błąd
    const handleSubmit = async (event) => {
    // Zatrzymujemy domyślne przeładowanie strony przez formularz
    event.preventDefault();

    // Czyścimy stare komunikaty przed nową próbą
    resetMessages();

    // Prosta walidacja po stronie frontu:
    // login, hasło i powtórzenie hasła muszą być uzupełnione
    if (!login.trim() || !password.trim() || !repeatPassword.trim()) {
      setErrorMessage(
        "Uzupełnij wymagane pola: login, hasło i powtórzenie hasła."
      );
      return;
    }

    // Hasło i powtórzenie hasła muszą być identyczne
    if (password !== repeatPassword) {
      setErrorMessage("Hasła nie są takie same.");
      return;
    }

    try {
      // Ustawiamy informację, że wysyłanie trwa
      setIsSubmitting(true);

      // Wysyłamy dane do backendu metodą POST
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          // Mówimy backendowi, że wysyłamy JSON
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          // trim() usuwa spacje z początku i końca
          login: login.trim(),
          password: password.trim(),
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          phone: phone.trim(),
        }),
      });

      // Odczytujemy odpowiedź backendu jako JSON
      const data = await response.json();

      // Jeśli backend zwrócił błąd (np. login zajęty),
      // pokazujemy komunikat błędu
      if (!response.ok) {
        setErrorMessage(data.message || "Wystąpił błąd podczas rejestracji.");
        return;
      }

      // Jeśli wszystko poszło dobrze, pokazujemy zielony komunikat
      setSuccessMessage(
        data.message ||
          "Konto zostało utworzone i oczekuje na aktywację przez superadministratora."
      );

      // Czyścimy formularz po sukcesie
      resetForm();
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
      <Card style={{ width: "520px" }}>
        <Card.Body>
          <Card.Title className="text-center mb-4">
            Rejestracja - TASKER
          </Card.Title>

          {/* Jeśli jest błąd, pokazujemy czerwony alert */}
          {errorMessage && (
            <Alert variant="danger" className="mb-3">
              {errorMessage}
            </Alert>
          )}

          {/* Jeśli jest sukces, pokazujemy zielony alert */}
          {successMessage && (
            <Alert variant="success" className="mb-3">
              {successMessage}
            </Alert>
          )}

          {/* Formularz rejestracji */}
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Login *</Form.Label>
              <Form.Control
                type="text"
                placeholder="Wpisz login"
                value={login}
                onChange={(event) => setLogin(event.target.value)}
                disabled={isSubmitting}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Hasło *</Form.Label>
              <Form.Control
                type="password"
                placeholder="Wpisz hasło"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={isSubmitting}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Powtórz hasło *</Form.Label>
              <Form.Control
                type="password"
                placeholder="Powtórz hasło"
                value={repeatPassword}
                onChange={(event) => setRepeatPassword(event.target.value)}
                disabled={isSubmitting}
              />
            </Form.Group>

            <hr />

            {/* Pola opcjonalne */}
            <Form.Group className="mb-3">
              <Form.Label>Imię</Form.Label>
              <Form.Control
                type="text"
                placeholder="Wpisz imię"
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                disabled={isSubmitting}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Nazwisko</Form.Label>
              <Form.Control
                type="text"
                placeholder="Wpisz nazwisko"
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                disabled={isSubmitting}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Adres e-mail</Form.Label>
              <Form.Control
                type="email"
                placeholder="Wpisz adres e-mail"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={isSubmitting}
              />
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label>Numer telefonu</Form.Label>
              <Form.Control
                type="text"
                placeholder="Wpisz numer telefonu"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                disabled={isSubmitting}
              />
            </Form.Group>

            {/* Główny przycisk wysyłający formularz */}
            <Button
              type="submit"
              variant="success"
              className="w-100 mb-3"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  {/* Spinner pokazuje, że coś się dzieje */}
                  <Spinner size="sm" className="me-2" />
                  Rejestrowanie...
                </>
              ) : (
                "Zarejestruj"
              )}
            </Button>
          </Form>

          {/* Przejście z powrotem do logowania */}
          <div className="text-center">
            <Button variant="link" onClick={onGoToLogin} disabled={isSubmitting}>
              Masz już konto? Wróć do logowania
            </Button>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
}

export default RegisterPage;