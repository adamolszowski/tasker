function normalizeContent(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function validateCreateMessageInput(body) {
  const content = normalizeContent(body.content);

  if (!content) {
    return { error: "Treść wiadomości jest wymagana." };
  }

  if (content.length < 2) {
    return { error: "Treść wiadomości musi mieć co najmniej 2 znaki." };
  }

  if (content.length > 4000) {
    return { error: "Treść wiadomości jest za długa." };
  }

  return {
    data: { content },
  };
}

function validateUpdateMessageInput(body) {
  return validateCreateMessageInput(body);
}

module.exports = {
  validateCreateMessageInput,
  validateUpdateMessageInput,
};