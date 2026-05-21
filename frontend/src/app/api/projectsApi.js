const API_URL = "http://localhost:5000";

async function sendRequest(authToken, path , options = {}) {
    const response = await fetch(`${API_URL}${path}`, {
        ...options,
        headers: {
            "Content-Type" : "application/json",
            Authorization: `Bearer ${authToken}`,
            ...(options.headers || {}),
        },
    });

    const data = await response.json().catch(()  => ({}));

    if (!response.ok) {
        throw new Error(data.message || "Nie udało się wykonać operacji.");
    }

    return data;
}

export function getProjects(authToken) {
  return sendRequest(authToken, "/api/projects", { method: "GET" });
}

export function getProjectStatuses(authToken) {
  return sendRequest(authToken, "/api/project-statuses", { method: "GET" });
}

export function createProject(authToken, payload) {
  return sendRequest(authToken, "/api/projects", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateProject(authToken, projectId, payload) {
  return sendRequest(authToken, `/api/projects/${projectId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function changeProjectStatus(authToken, projectId, payload) {
  return sendRequest(authToken, `/api/projects/${projectId}/status`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function getProjectMembers(authToken, projectId) {
  return sendRequest(authToken, `/api/projects/${projectId}/members`, {
    method: "GET",
  });
}

export function addProjectMember(authToken, projectId, payload) {
  return sendRequest(authToken, `/api/projects/${projectId}/members`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function removeProjectMember(authToken, projectId, userId) {
  return sendRequest(authToken, `/api/projects/${projectId}/members/${userId}`, {
    method: "DELETE",
  });
}

export function getUsersDirectory(authToken) {
  return sendRequest(authToken, "/api/users", { method: "GET" });
}

