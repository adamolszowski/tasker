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

export function getProjectMessages(authToken, projectId) {
  return sendRequest(authToken, `/api/projects/${projectId}/messages`, {
    method: "GET",
  });
}

export function createMessage(authToken, projectId, payload) {
  return sendRequest(authToken, `/api/projects/${projectId}/messages`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateMessage(authToken, messageId, payload) {
  return sendRequest(authToken, `/api/messages/${messageId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteMessage(authToken, messageId) {
  return sendRequest(authToken, `/api/messages/${messageId}`, {
    method: "DELETE",
  });
}