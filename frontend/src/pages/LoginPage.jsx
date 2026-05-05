import React, { useState } from "react";
import Card from "react-bootstrap/Card";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";

function LoginPage({ onLogin, onGoToRegister}) {
    const [login, setLogin] = useState("");
    const [password, setPassword] = useState("");

    const handleSubmit = (event) => {
        event.preventDefault();
   
        onLogin({
           login,
           password,
        });
    };

    return (
<div className="d-flex align-items-center justify-content-center min-vh-100">
    <Card style={{widt: "420px" }}>
        <Card.Body>
            <Card.Title className="text-center mb-4">TASKER</Card.Title>

            <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                    <Form.Label>Login</Form.Label>
                    <Form.Control
                    type="text"
                    placeholder="Wpisz login"
                    value={login}
                    onChange={(event) => setLogin(event.target.value)}
                    />
                </Form.Group>

               <Form.Group className="mb-4">
                 <Form.Label>Hasło</Form.Label>
                 <Form.Control
                 type="password"
                 placeholder="Wpisz hasło"
                 value={password}
                 onChange={(event) => setPassword(event.target.value)}
                 />
               </Form.Group> 

               <Button type="submit" variant="primary" className="w-100 mb-3">
                Zaloguj
                </Button>
                </Form>

                <div className="text-center">
                    <Button variant="link" onClick={onGoToRegister}>
                        Nie masz konta? Zarejestruj się
                    </Button>
                    </div>           
                    </Card.Body>
                    </Card>
            </div>
    );
}
    
export default LoginPage;
