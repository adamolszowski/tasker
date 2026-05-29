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

function canViewComments(user, projectContext, isProjectMember) {
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

function canCreateComment(user, projectContext, isProjectMember) {
  return canViewComments(user, projectContext, isProjectMember);
}

function canEditComment(user, comment, projectContext) {
  if (!user || !comment || !projectContext) {
    return false;
  }

  if (isAdminLike(user)) {
    return true;
  }

  if (isDeletedProject(projectContext)) {
    return canUseDeletedProjectAsManager(user, projectContext);
  }

  if (Number(comment.user_id) === getUserId(user)) {
    return true;
  }

  if (user.role === "kierownik") {
    return isProjectOwner(user, projectContext);
  }

  return false;
}

function canDeleteComment(user, comment, projectContext) {
  return canEditComment(user, comment, projectContext);
}

module.exports = {
  canViewComments,
  canCreateComment,
  canEditComment,
  canDeleteComment,
};