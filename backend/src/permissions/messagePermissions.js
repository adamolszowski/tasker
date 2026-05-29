function isAdminLike(user) {
  return user.role === "administrator" || user.role === "superadmin";
}

function getUserId(user) {
  return Number(user?.id ?? user?.sub);
}

function isProjectOwner(user, projectContext) {
  return Number(projectContext.created_by_user_id) === getUserId(user);
}

function isDeletedProject(projectContext) {
  const statusName = String(projectContext?.status_name || projectContext?.statusName || "")
    .trim()
    .toLowerCase();

  return statusName === "usuniety" || statusName === "usunięty";
}

function canUseDeletedProjectAsManager(user, projectContext) {
  return user.role === "kierownik" && isProjectOwner(user, projectContext);
}

function canViewProjectMessages(user, projectContext, isProjectMember) {
  if (!user || !projectContext) {
    return false;
  }

  if (isAdminLike(user)) {
    return true;
  }

  if (isDeletedProject(projectContext)) {
    return canUseDeletedProjectAsManager(user, projectContext);
  }

  if (user.role === "kierownik") {
    return isProjectOwner(user, projectContext) || isProjectMember === true;
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

  if (isDeletedProject(projectContext)) {
    return canUseDeletedProjectAsManager(user, projectContext);
  }

  if (Number(message.user_id) === getUserId(user)) {
    return true;
  }

  if (user.role === "kierownik") {
    return isProjectOwner(user, projectContext);
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