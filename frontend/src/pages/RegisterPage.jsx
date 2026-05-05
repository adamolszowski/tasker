import React, { useState } from "react";
import Card from "react-bootstrap/Card";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Alert from "react-bootstrap/Alert";

function RegisterPage({ onGoToLogin, onRegister}) {
    const [login, setLogin] = useState("");
    const [password, setPassword] = useState("");
    const [repeatPassword, setRepeatPassword] = useState("");

    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");

    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const handleSubmit = (event) => {
        event.preventDefault();

        setErrorMessage("");
        setSuccessMessage("");

        if (!login.trim() || !password.trim() || !repeatPassword.trim()) {
            setErrorMessage("Uzupełnij wymagane pola: login, hasło i powtórz hasło.");
            return;
            }
    
            if (password !== repeatPassword) {
                setErrorMessage("Hasła nie są takie same");
                return;
            }
        
        const registerData = {
            login: login.trim(),
            password: password.trim(),
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.trim(),
            phone: phone.trim(),
        };
        
        if (onRegister) {
            onRegister(registerData);
            }

            setSuccessMessage(
                "Konti zostało utworzone i oczekuje na akceptację przez superadministratora."
            );

            setLogin("");
            setPassword("");
            setRepeatPassword("");
            setFirstName("");
            setLastName("");
            setEmail("");
            setPhone("");
};

return (
    <div className="d-flex align-items-center justify-content-center min-vh-100">
        <Card style={{ width: "520px" }}>
          <Card.Body>
             <Card.Title className="text-center mb-4">
                Rejestracja - TASKER
             </Card.Title>

             {errorMessage && (
                <Alert variant="danger" className="mb-3">
                    {errorMessage}
                </Alert>
             )}

            {successMessage && (
                <Alert  variant="success" className="mb-3">
                    {successMessage}
                </Alert>
            )}

            <Form onSubmit={handleSubmit}>
                        <Form.Group className="mb-3">
                          <Form.Label>Login *</Form.Label>
                          <Form.Control
                            type="text"
                            placeholder="Wpisz login"
                            value={login}
                            onChange={(event) => setLogin(event.target.value)}
                          />
                        </Form.Group>

                        <Form.Group className="mb-3">
                          <Form.Label>Hasło *</Form.Label>
                          <Form.Control
                            type="password"
                            placeholder="Wpisz hasło"
                            value={login}
                            onChange={(event) => setPassword(event.target.value)}
                          />
                        </Form.Group>            

                        <Form.Group className="mb-3">
                          <Form.Label>Powtórz hasło *</Form.Label>
                          <Form.Control
                            type="password"
                            placeholder="Powtórz hasło"
                            value={login}
                            onChange={(event) => setRepeatPassword(event.target.value)}
                          />
                        </Form.Group> 

                        <hr />

                        <Form.Group className="mb-3">
                          <Form.Label>Imię</Form.Label>
                          <Form.Control
                            type="text"
                            placeholder="Wpisz imię"
                            value={login}
                            onChange={(event) => setFirstName(event.target.value)}
                          />
                          </Form.Group>

                        <Form.Group className="mb-3">
                          <Form.Label>Nazwisko</Form.Label>
                          <Form.Control
                            type="text"
                            placeholder="Wpisz nazwisko"
                            value={login}
                            onChange={(event) => setLastName(event.target.value)}
                          />
                        </Form.Group> 

                        <Form.Group className="mb-3">
                          <Form.Label>Adres e-mail</Form.Label>
                          <Form.Control
                            type="text"
                            placeholder="Wpisz adres e-mail"
                            value={login}
                            onChange={(event) => setEmail(event.target.value)}
                          />
                        </Form.Group> 

                        <Form.Group className="mb-4">
                          <Form.Label>Login *</Form.Label>
                          <Form.Control
                            type="text"
                            placeholder="Wpisz numer telefonu"
                            value={login}
                            onChange={(event) => setPhone(event.target.value)}
                          />
                        </Form.Group> 

                        <Button type="submit" variant="success" className="w-100 mb-3">
                            Zarejestruj
                        </Button>
                        </Form>

                        <div className="text-center">
                            <Button variant="link" onClick={onGoToLogin}>
                                Msz już konto? Wróć do logowania
                            </Button>
                        </div>
                    </Card.Body>
                </Card>
            </div>
         );
    }
     
    export default RegisterPage;
