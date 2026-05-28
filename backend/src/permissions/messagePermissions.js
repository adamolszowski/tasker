function isAdminLike(user) {
  return user.role === "administrator" || user.role === "superadmin";
}

function canViewProjectMessages(user, projectContext, isProjectMember) {
  if (!user || !projectContext) {
    return false;
  }

  if (isAdminLike(user)) {
    return true;
  }

  if (user.role === "kierownik") {
    return (
      projectContext.created_by_user_id === user.id ||
      isProjectMember === true
    );
  }

  if (user.role === "pracownik") {
    return isProjectMember === true;
  }

  return false;
}

function canCreateProjectMessage(user, projectContext, isProjectMember) {
  return canViewProjectMessages(user, projectContext, isProjectMember);
}

function canEditProjectMessage(user, message, projectContext) {
  if (!user || !message || !projectContext) {
    return false;
  }

  if (isAdminLike(user)) {
    return true;
  }

  if (message.user_id === user.id) {
    return true;
  }

  if (user.role === "kierownik") {
    return projectContext.created_by_user_id === user.id;
  }

  return false;
}

function canDeleteProjectMessage(user, message, projectContext) {
  return canEditProjectMessage(user, message, projectContext);
}

module.exports = {
  canViewProjectMessages,
  canCreateProjectMessage,
  canEditProjectMessage,
  canDeleteProjectMessage,
};