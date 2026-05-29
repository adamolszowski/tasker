const API_URL = "http://localhost:5000";

async function sendRequest(authToken, path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Nie udało się wykonać operacji.");
  }

  return data;
}

export function getNotifications(authToken, options = {}) {
  const params = new URLSearchParams();

  if (options.unreadOnly) {
    params.set("unreadOnly", "true");
  }

  if (options.limit) {
    params.set("limit", options.limit);
  }

  const query = params.toString() ? `?${params.toString()}` : "";

  return sendRequest(authToken, `/api/notifications${query}`, {
    method: "GET",
  });
}

export function getUnreadNotificationsCount(authToken) {
  return sendRequest(authToken, "/api/notifications/unread-count", {
    method: "GET",
  });
}

export function markNotificationRead(authToken, notificationId) {
  return sendRequest(authToken, `/api/notifications/${notificationId}/read`, {
    method: "PATCH",
  });
}

export function markAllNotificationsRead(authToken) {
  return sendRequest(authToken, "/api/notifications/read-all", {
    method: "PATCH",
  });
}

export function getUnreadChatNotificationsCount(authToken) {
  return sendRequest(authToken, "/api/notifications/chat/unread-count", {
    method: "GET",
  });
}

export function markProjectMessagesNotificationsRead(authToken, projectId) {
  return sendRequest(authToken, `/api/projects/${projectId}/messages/read`, {
    method: "PATCH",
  });
}