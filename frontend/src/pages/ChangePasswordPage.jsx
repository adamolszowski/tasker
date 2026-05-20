import React, { useState } from "react";
import Card from "react-bootstrap/Card";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Alert from "react-bootstrap/Alert";
import Spinner from "react-bootstrap/Spinner";

// Adres backendu - tu wysylamy request zmiany hasla
const API_URL = "http://localhost:5000";

// Ten widok ma sluzyc tylko do wymuszonej zmiany hasla.
// Dostaje:
// - authToken, zeby wyslac request do backendu
// - onPasswordChanged, zeby App.jsx wiedzial, ze haslo zostalo zmienione
function ChangePasswordPage({ authToken, onPasswordChanged }) {
    // Pole na obecne haslo
    const [currentPassword, setCurrentPassword] = useState("");

    // Pole na nowe haslo
    const [newPassword, setNewPassword] = useState("");

    // Komunikat bledu
    const [errorMessage, setErrorMessage] = useState("");

    // Komunikat sukcesu
    const [successMessage, setSuccessMessage] = useState("");

    // Flaga wysylania formularza
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();

        setErrorMessage("");
        setSuccessMessage("");

        // Walidacja po stronie frontu
        if (!currentPassword.trim()) {
            setErrorMessage("Obecne haslo jest wymagane");
            return;
        }

        if (!newPassword.trim()) {
            setErrorMessage("Nowe haslo jest wymagane.");
            return;
        }

        if (newPassword.trim().length < 6) {
            setErrorMessage("Nowe hasło musi mieć co najmniej 6 znaków.");
            return;
        }

        try {
            setIsSubmitting(true);

            const response = await fetch(`${API_URL}/api/auth/change-password`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${authToken}`,
                },
                body: JSON.stringify({
                    currentPassword: currentPassword.trim(),
                    newPassword: newPassword.trim(),
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setErrorMessage(data.message || "Nie udało się zmienić hasła.");
                return;
            }

            setSuccessMessage(data.message || "Hasło zostało zmienione.");

            // Czyscimy pola po sukcesie
            setCurrentPassword("");
            setNewPassword("");

            // Dajemy chwilke na pokazanie kominukatu i dopiero potem wpuszczamy dalej
            setTimeout(() => {
                onPasswordChanged();
            }, 800);
        } catch (error) {
            setErrorMessage("Nie udało się połączyć z backendem.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="d-flex align-items-center justify-content-center min-vh-100 bg-light">
            <Card style={{ width: "460px" }}>
                <Card.Body>
                    <Card.Title className="text-center mb-3">
                        Wymagana zmiana hasła
                    </Card.Title>
                

                <p className="text-muted text-center mb-4">
                    To jest pierwsze logowanie na koncie startowym. Ustaw nowe hasło, aby
                    przejść dalej.
                </p>

                {errorMessage && (
                    <Alert variant="danger" className="mb-3">
                        {errorMessage}
                    </Alert>
                )}

                {successMessage && (
                    <Alert variant="success" className="mb-3">
                        {successMessage}
                    </Alert>
                )}
                

                <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3">
                        <Form.Label>Obecne hasło</Form.Label>
                        <Form.Control
                            type="password"
                            placeholder="Wpisz obecne haslo"
                            value={currentPassword}
                            onChange={(event) => setCurrentPassword(event.target.value)}
                            disabled={isSubmitting}
                        />
                    </Form.Group>

                    <Form.Group className="mb-4">
                        <Form.Label>Nowe hasło</Form.Label>
                        <Form.Control
                            type="password"
                            placeholder="Wpisz nowe hasło"
                            value={newPassword}
                            onChange={(event) => setNewPassword(event.target.value)}
                            disabled={isSubmitting}
                        />
                    </Form.Group>

                    <Button
                        type="submit"
                        variant="dark"
                        className="w-100"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <Spinner size="sm" className="me-2">
                                    
                                </Spinner>

                                <span>Zmienianie hasla...</span>
                            </>
                        ) : (
                          "Zmień hasło"  
                        )}
                    </Button>
                </Form>
                </Card.Body>
            </Card>
        </div>
    );
}

export default ChangePasswordPage;
