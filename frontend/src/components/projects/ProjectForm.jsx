import React, { useEffect, useState } from "react";
import Card from "react-bootstrap/Card";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Alert from "react-bootstrap/Alert";
import Spinner from "react-bootstrap/Spinner";

function ProjectForm({ mode, initialProject, onSubmit, onCancel, isSubmitting }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    setName(initialProject?.name || "");
    setDescription(initialProject?.description || "");
    setErrorMessage("");
  }, [initialProject, mode]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");

    if (!name.trim()) {
      setErrorMessage("Nazwa projektu jest wymagana.");
      return;
    }

    if (name.trim().length < 3) {
      setErrorMessage("Nazwa projektu musi mieć co najmniej 3 znaki.");
      return;
    }

    await onSubmit({
      name: name.trim(),
      description: description.trim() || null,
    });
  };

  return (
    <Card className="mb-4 border">
      <Card.Body>
        <h4 className="mb-3">
          {mode === "edit" ? "Edycja projektu" : "Nowy projekt"}
        </h4>

        {errorMessage && (
          <Alert variant="danger" className="mb-3">
            {errorMessage}
          </Alert>
        )}

        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Nazwa projektu</Form.Label>
            <Form.Control
              type="text"
              placeholder="Wpisz nazwę projektu"
              value={name}
              onChange={(event) => setName(event.target.value)}
              disabled={isSubmitting}
            />
          </Form.Group>

          <Form.Group className="mb-4">
            <Form.Label>Opis projektu</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              placeholder="Krótki opis projektu"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              disabled={isSubmitting}
            />
          </Form.Group>

          <div className="d-flex gap-2">
            <Button type="submit" variant="dark" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Spinner size="sm" className="me-2" />
                  Zapisywanie...
                </>
              ) : mode === "edit" ? (
                "Zapisz zmiany"
              ) : (
                "Utwórz projekt"
              )}
            </Button>

            <Button type="button" variant="outline-secondary" onClick={onCancel} disabled={isSubmitting}>
              Anuluj
            </Button>
          </div>
        </Form>
      </Card.Body>
    </Card>
  );
}

export default ProjectForm;
