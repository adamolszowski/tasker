import React, { useEffect, useMemo, useState } from "react";
import Card from "react-bootstrap/Card";
import Alert from "react-bootstrap/Alert";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Spinner from "react-bootstrap/Spinner";
import Stack from "react-bootstrap/Stack";
import NotificationItem from "../components/notifications/NotificationItem";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../api/notificationsApi";

function NotificationsPage({ authToken, onNotificationsChanged }) {
  const [notifications, setNotifications] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [markingNotificationId, setMarkingNotificationId] = useState(null);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const loadNotifications = async (unreadOnly = showUnreadOnly) => {
    const data = await getNotifications(authToken, {
      unreadOnly,
      limit: 100,
    });

    setNotifications(data.notifications || []);
  };

  useEffect(() => {
    let intervalId = null;

    const loadData = async () => {
      if (!authToken) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setErrorMessage("");
        await loadNotifications(showUnreadOnly);
      } catch (error) {
        setErrorMessage(error.message || "Nie udało się pobrać powiadomień.");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();

    intervalId = window.setInterval(() => {
      loadNotifications(showUnreadOnly).catch(() => {});
      if (onNotificationsChanged) {
        onNotificationsChanged();
      }
    }, 15000);

    return () => {
      if (intervalId) {
        window.clearInterval(intervalId);
      }
    };
  }, [authToken, showUnreadOnly, onNotificationsChanged]);

  const filteredNotifications = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) {
      return notifications;
    }

    return notifications.filter((notification) => {
        return (
            (notification.title || "").toLowerCase().includes(query) ||
            (notification.content || "").toLowerCase().includes(query) ||
            (notification.projectName || "").toLowerCase().includes(query) ||
            (notification.taskTitle || "").toLowerCase().includes(query) ||
            (notification.actorName || "").toLowerCase().includes(query) ||
            (notification.sourceText || "").toLowerCase().includes(query)
        );
    });
  }, [notifications, searchTerm]);

  const handleMarkRead = async (notificationId) => {
    try {
      setMarkingNotificationId(notificationId);
      setErrorMessage("");
      setSuccessMessage("");

      const data = await markNotificationRead(authToken, notificationId);

      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === notificationId
            ? {
                ...notification,
                isRead: true,
                readAt: data.notification?.read_at || new Date().toISOString(),
              }
            : notification
        )
      );

      setSuccessMessage(data.message || "Powiadomienie zostało oznaczone jako przeczytane.");

      if (onNotificationsChanged) {
        await onNotificationsChanged();
      }
    } catch (error) {
      setErrorMessage(error.message || "Nie udało się oznaczyć powiadomienia.");
    } finally {
      setMarkingNotificationId(null);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      setIsMarkingAll(true);
      setErrorMessage("");
      setSuccessMessage("");

      const data = await markAllNotificationsRead(authToken);

      setNotifications((prev) =>
        prev.map((notification) => ({
          ...notification,
          isRead: true,
          readAt: notification.readAt || new Date().toISOString(),
        }))
      );

      setSuccessMessage(data.message || "Wszystkie powiadomienia zostały oznaczone jako przeczytane.");

      if (onNotificationsChanged) {
        await onNotificationsChanged();
      }
    } catch (error) {
      setErrorMessage(error.message || "Nie udało się oznaczyć wszystkich powiadomień.");
    } finally {
      setIsMarkingAll(false);
    }
  };

  const unreadCount = notifications.filter((notification) => !notification.isRead).length;

  return (
    <div>
      <Card className="mb-4 border">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
            <div>
              <h2 className="mb-1">POWIADOMIENIA</h2>
              <p className="text-muted mb-0">
                Lista najważniejszych zdarzeń związanych z projektami i zadaniami
              </p>
            </div>

            <div className="d-flex gap-2 flex-wrap">
              <Button
                variant="outline-dark"
                onClick={handleMarkAllRead}
                disabled={isMarkingAll || unreadCount === 0}
              >
                {isMarkingAll ? (
                  <>
                    <Spinner size="sm" className="me-2" />
                    Oznaczanie...
                  </>
                ) : (
                  "Oznacz wszystkie jako przeczytane"
                )}
              </Button>
            </div>
          </div>

          <Stack direction="horizontal" gap={2} className="flex-wrap">
            <Form.Control
              style={{ maxWidth: "320px" }}
              type="text"
              placeholder="Szukaj powiadomienia..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />

            <Form.Check
              type="switch"
              id="unread-only-switch"
              label="Tylko nieprzeczytane"
              checked={showUnreadOnly}
              onChange={(event) => setShowUnreadOnly(event.target.checked)}
            />
          </Stack>
        </Card.Body>
      </Card>

      {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
      {successMessage && <Alert variant="success">{successMessage}</Alert>}

      {isLoading ? (
        <Card className="border">
          <Card.Body className="text-center py-4">
            <Spinner className="me-2" />
            Ładowanie powiadomień...
          </Card.Body>
        </Card>
      ) : filteredNotifications.length === 0 ? (
        <Alert variant="secondary">Brak powiadomień do wyświetlenia.</Alert>
      ) : (
        <div className="d-flex flex-column gap-3">
          {filteredNotifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              isMarkingRead={markingNotificationId === notification.id}
              onMarkRead={handleMarkRead}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default NotificationsPage;
