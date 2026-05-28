function normalizeContent(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function validateCreateCommentInput(body) {
  const content = normalizeContent(body.content);

  if (!content) {
    return { error: "Treść komentarza jest wymagana." };
  }

  if (content.length < 2) {
    return { error: "Treść komentarza musi mieć co najmniej 2 znaki." };
  }

  if (content.length > 2000) {
    return { error: "Treść komentarza jest za długa." };
  }

  return {
    data: { content },
  };
}

function validateUpdateCommentInput(body) {
  return validateCreateCommentInput(body);
}

module.exports = {
  validateCreateCommentInput,
  validateUpdateCommentInput,
};
