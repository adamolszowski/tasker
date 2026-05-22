const API_URL = "http://localhost:5000";

// pomocnicza funkcja do wysylania requestow do backendu
// przyjmuje token, sciezke endpointu oraz dodatkowe opcje fetch
async function sendRequest(authToken, path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      // domyslnie wysylamy json
      "Content-Type": "application/json",

      // dolaczamy token zalogowanego usera
      Authorization: `Bearer ${authToken}`,

      // jesli w options.headers sa jakies dodatkowe naglowki
      // to dokladamy je tutaj
      ...(options.headers || {}),
    },
  });

  // probujemy odczytac odpowiedz jako json
  // jak sie nie uda to zwracamy pusty obiekt
  const data = await response.json().catch(() => ({}));

  // jesli backend zwrocil blad, rzucamy Error z komunikatem
  if (!response.ok) {
    throw new Error(data.message || "Nie udało się wykonać operacji.");
  }

  // jak wszystko jest okej to zwracamy dane
  return data;
}

// pobieranie listy zadan z opcjonalnymi filtrami
export function getTasks(authToken, filters = {}) {
  // obiekt do budowania query stringa w adresie
  const params = new URLSearchParams();

  // jesli podano filtr projektu to dodajemy go do adresu
  if (filters.projectId) {
    params.set("projectId", filters.projectId);
  }

  // jesli podano filtr statusu to dodajemy go do adresu
  if (filters.statusId) {
    params.set("statusId", filters.statusId);
  }

  // jesli podano filtr priorytetu to dodajemy go do adresu
  if (filters.priorityId) {
    params.set("priorityId", filters.priorityId);
  }

  // jesli podano filtr przypisanego usera to tez go dodajemy
  if (filters.assignedUserId) {
    params.set("assignedUserId", filters.assignedUserId);
  }

  // jesli params nie jest puste to tworzymy query string typu ?statusId=1&priorityId=2
  const query = params.toString() ? `?${params.toString()}` : "";

  // wysylamy request GET po liste zadan
  return sendRequest(authToken, `/api/tasks${query}`, { method: "GET" });
}

// pobieranie zadan z jednego konkretnego projektu
export function getProjectTasks(authToken, projectId, filters = {}) {
  const params = new URLSearchParams();

  // przy zadaniach projektu mozemy dalej filtrowac np po statusie
  if (filters.statusId) {
    params.set("statusId", filters.statusId);
  }

  if (filters.priorityId) {
    params.set("priorityId", filters.priorityId);
  }

  if (filters.assignedUserId) {
    params.set("assignedUserId", filters.assignedUserId);
  }

  const query = params.toString() ? `?${params.toString()}` : "";

  // pobieramy zadania tylko z konkretnego projektu
  return sendRequest(authToken, `/api/projects/${projectId}/tasks${query}`, {
    method: "GET",
  });
}

// pobieranie listy mozliwych statusow zadan
export function getTaskStatuses(authToken) {
  return sendRequest(authToken, "/api/task-statuses", { method: "GET" });
}

// pobieranie listy mozliwych priorytetow zadan
export function getTaskPriorities(authToken) {
  return sendRequest(authToken, "/api/task-priorities", { method: "GET" });
}

// pobieranie listy projektow dostepnych dla usera
export function getProjects(authToken) {
  return sendRequest(authToken, "/api/projects", { method: "GET" });
}

// pobieranie userow z projektu, ktorych mozna przypisac do zadania
export function getAssignableUsers(authToken, projectId) {
  return sendRequest(authToken, `/api/projects/${projectId}/task-assignable-users`, {
    method: "GET",
  });
}

// tworzenie nowego zadania
// payload to obiekt z danymi formularza
export function createTask(authToken, payload) {
  return sendRequest(authToken, "/api/tasks", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// aktualizacja istniejacego zadania
export function updateTask(authToken, taskId, payload) {
  return sendRequest(authToken, `/api/tasks/${taskId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

// usuwanie zadania po id
export function deleteTask(authToken, taskId) {
  return sendRequest(authToken, `/api/tasks/${taskId}`, {
    method: "DELETE",
  });
}

// zmiana samego statusu zadania
export function changeTaskStatus(authToken, taskId, payload) {
  return sendRequest(authToken, `/api/tasks/${taskId}/status`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}