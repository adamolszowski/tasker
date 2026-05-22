//plik z funkcjami do sprawdzenia poprawnosci wprowadzanych danych

function normalizeOptionalText(value) {
    if (typeof value !== "string") {
        return null;
    } // jesli podana do funckji value nie jest typu string to zwracamy null

    const trimmed = value.trim(); // przycinamy biale znaki
    return trimmed === "" ? null : trimmed;
    // jesli nic nie zostalo to zwracamy null, a jak zostalo
    // to zwracamy to co zostalo
}

function normalizeOptionalNumber(value) {
    if (value === null || value === undefined || value === "") {
        return null;
    } // jesli wartosc jest null lub niezdefiniowana lub jest pustym stringiem
    // to zwracamy null

    const numberValue = Number(value); // przetwarzamy value na liczbe

    if (Number.isNaN(numberValue)) {
        return null; // jesli po zamianie na liczbe wyszlo NaN, to znaczy ze value nie bylo poprawna liczba
    }

    return numberValue;
}

function normalizeOptionalDate(value) {
  if (typeof value !== "string") {
    return null;
  } // jesli podana do funckji value nie jest typu string to zwracamy null

  const trimmed = value.trim(); // przycinamy biale znaki
  return trimmed === "" ? null : trimmed;
  // jesli nic nie zostalo to zwracamy null, a jak zostalo
  // to zwracamy to co zostalo
}

//funkcja do sprawdzania poprawnosci danych przy tworzeniu zadania
function validateCreateTaskInput(body) {
  // sprawdzamy czy tytul jest stringiem, jak tak to wycinamy biale znaki, jak nie to zwracamy ""
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const description = normalizeOptionalText(body.description); // normalizacja opisu
  const deadline = normalizeOptionalDate(body.deadline); // normalizacja daty
  const projectId = Number(body.projectId);
  // probujemy zamienic projectId na liczbe, bo id projektu powinno byc liczbowe
  const assignedUserId = normalizeOptionalNumber(body.assignedUserId);
  const priorityId = normalizeOptionalNumber(body.priorityId);

  if (!projectId || Number.isNaN(projectId)) {
    return { error: "ID projektu jest wymagane." };
  } // jesli projectId nie istnieje albo po zamianie dalej 
  // nie jest poprawna liczba, to nie mozemy tworzyc zadania

  if (!title) {
    return { error: "Tytuł zadania jest wymagany." };
  } 

  if (title.length < 3) {
    return { error: "Tytuł zadania musi mieć co najmniej 3 znaki." };
  }

return {
    data: {
      title,
      description,
      deadline,
      projectId,
      assignedUserId,
      priorityId,
    },
  };
}

//funkcja do sprawdzania poprawnosci danych aktualizacji zadania
function validateUpdateTaskInput(body) {
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const description = normalizeOptionalText(body.description);
  const deadline = normalizeOptionalDate(body.deadline);
  const assignedUserId = normalizeOptionalNumber(body.assignedUserId);
  const priorityId = normalizeOptionalNumber(body.priorityId);

  if (!title) {
    return { error: "Tytuł zadania jest wymagany." };
  }

  if (title.length < 3) {
    return { error: "Tytuł zadania musi mieć co najmniej 3 znaki." };
  }

  return {
    data: {
      title,
      description,
      deadline,
      assignedUserId,
      priorityId,
    },
  };
}

// sprawdzanie poprawnosci przypisania statusu zadania poprzez walidacje
// wartosci, sprawdzamy czy jest to numer
function validateTaskStatusInput(body) {
    const statusId = Number(body.statusId);
    // probujemy zamienic statusId na liczbe, bo id statusu powinno byc liczbowe

    if (!statusId || Number.isNaN(statusId)) {
        return { error: "Status zadania jest wymagany" };
    }

    return {
        data: { statusId }
    }
}

// sprawdzamy poprawnosc filtrow
function validateTaskFilters(query) {
  return {
    data: {
      projectId: normalizeOptionalNumber(query.projectId),
      statusId: normalizeOptionalNumber(query.statusId),
      priorityId: normalizeOptionalNumber(query.priorityId),
      assignedUserId: normalizeOptionalNumber(query.assignedUserId),
    },
  };
}

// eksportujemy aby mozna bylo uzyc gdzies indziej
module.exports = {
  validateCreateTaskInput,
  validateUpdateTaskInput,
  validateTaskStatusInput,
  validateTaskFilters,
};