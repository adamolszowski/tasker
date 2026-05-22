// Walidacje zwiazane z projektami.
// Trzymamy je osobno, zeby server.js nie puchl jeszcze bardziej.

function normalizeProjectText(value) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function validateCreateProjectInput(body) {
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const description = normalizeProjectText(body.description);

  if (!name) {
    return { error: "Nazwa projektu jest wymagana." };
  }

  if (name.length < 3) {
    return { error: "Nazwa projektu musi mieć co najmniej 3 znaki." };
  }

  if (name.length > 150) {
    return { error: "Nazwa projektu może mieć maksymalnie 150 znaków." };
  }

  return {
    data: {
      name,
      description,
    },
  };
}

function validateUpdateProjectInput(body) {
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const description = normalizeProjectText(body.description);

  if (!name) {
    return { error: "Nazwa projektu jest wymagana." };
  }

  if (name.length < 3) {
    return { error: "Nazwa projektu musi mieć co najmniej 3 znaki." };
  }

  if (name.length > 150) {
    return { error: "Nazwa projektu może mieć maksymalnie 150 znaków." };
  }

  return {
    data: {
      name,
      description,
    },
  };
}

function validateProjectStatusInput(body) {
  const statusId = Number(body.statusId);

  if (!statusId || Number.isNaN(statusId)) {
    return { error: "Status projektu jest wymagany." };
  }

  return {
    data: {
      statusId,
    },
  };
}

function validateProjectMemberInput(body) {
  const userId = Number(body.userId);

  if (!userId || Number.isNaN(userId)) {
    return { error: "ID użytkownika jest wymagane." };
  }

  return {
    data: {
      userId,
    },
  };
}

module.exports = {
  validateCreateProjectInput,
  validateUpdateProjectInput,
  validateProjectStatusInput,
  validateProjectMemberInput,
};
