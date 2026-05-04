import React, { useState } from "react";
import Container from "react-bootstrap/Container";
import Card from "react-bootstrap/Card";
import Button from "react-bootstrap/Button";
import ListGroup from "react-bootstrap/ListGroup";

function App() {
  const [healthResponse, setHealthResponse] = useState("Brak odpowiedzi jeszcze.");
  const [statuses, setStatuses] = useState([]);
  const [loadingHealth, setLoadingHealth] = useState(false);
  const [loadingStatuses, setLoadingStatuses] = useState(false);

  const checkBackend = async () => {
    try {
      setLoadingHealth(true);

      const res = await fetch("http://localhost:5000/api/health");
      const data = await res.json();

      setHealthResponse(JSON.stringify(data));
    } catch (error) {
      setHealthResponse("Błąd połączenia z backendem.");
    } finally {
      setLoadingHealth(false);
    }
  };

  const loadProjectStatuses = async () => {
    try {
      setLoadingStatuses(true);

      const res = await fetch("http://localhost:5000/api/project-statuses");
      const data = await res.json();

      setStatuses(data);
    } catch (error) {
      setStatuses([]);
    } finally {
      setLoadingStatuses(false);
    }
  };

  return (
    <Container className="py-5">
      <Card className="mb-4">
        <Card.Body>
          <Card.Title>Tasker frontend działa</Card.Title>
          <Card.Text>
            To jest prosty test połączenia frontendu z backendem.
          </Card.Text>

          <Button variant="primary" onClick={checkBackend} disabled={loadingHealth}>
            {loadingHealth ? "Sprawdzanie..." : "Sprawdź backend"}
          </Button>

          <hr />

          <div>
            <strong>Odpowiedź z backendu:</strong>
            <div>{healthResponse}</div>
          </div>
        </Card.Body>
      </Card>

      <Card>
        <Card.Body>
          <Card.Title>Statusy projektu z bazy</Card.Title>
          <Card.Text>
            To jest prosty odczyt z tabeli słownikowej <code>project_statuses</code>.
          </Card.Text>

          <Button
            variant="success"
            onClick={loadProjectStatuses}
            disabled={loadingStatuses}
            className="mb-3"
          >
            {loadingStatuses ? "Pobieranie..." : "Pobierz statusy projektu"}
          </Button>

          {statuses.length > 0 ? (
            <ListGroup>
              {statuses.map((status) => (
                <ListGroup.Item key={status.id}>
                  {status.id} - {status.name}
                </ListGroup.Item>
              ))}
            </ListGroup>
          ) : (
            <div>Brak pobranych statusów.</div>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
}

export default App;