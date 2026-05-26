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

export function getTaskComments(authToken, taskId) {
  return sendRequest(authToken, `/api/tasks/${taskId}/comments`, {
    method: "GET",
  });
}

export function createComment(authToken, taskId, payload) {
  return sendRequest(authToken, `/api/tasks/${taskId}/comments`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateComment(authToken, commentId, payload) {
  return sendRequest(authToken, `/api/comments/${commentId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteComment(authToken, commentId) {
  return sendRequest(authToken, `/api/comments/${commentId}`, {
    method: "DELETE",
  });
}
