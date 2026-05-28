import React from "react";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Spinner from "react-bootstrap/Spinner";

function MessageForm({
  value,
  onChange,
  onSubmit,
  onCancel,
  isSubmitting,
  submitLabel,
  placeholder,
}) {
  return (
    <Form onSubmit={onSubmit}>
      <Form.Group className="mb-2">
        <Form.Control
          as="textarea"
          rows={3}
          placeholder={placeholder}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={isSubmitting}
        />
      </Form.Group>

      <div className="d-flex gap-2 flex-wrap">
        <Button type="submit" variant="dark" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Spinner size="sm" className="me-2" />
              Zapisywanie...
            </>
          ) : (
            submitLabel
          )}
        </Button>

        {onCancel && (
          <Button
            type="button"
            variant="outline-secondary"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Anuluj
          </Button>
        )}
      </div>
    </Form>
  );
}

export default MessageForm;