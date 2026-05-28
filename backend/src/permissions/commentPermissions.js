function isAdminLike(user) {
  return user.role === "administrator" || user.role === "superadmin";
}

function canViewComments(user, projectContext, isProjectMember) {
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

function canCreateComment(user, projectContext, isProjectMember) {
  return canViewComments(user, projectContext, isProjectMember);
}

function canEditComment(user, comment, projectContext) {
  if (isAdminLike(user)) {
    return true;
  }

  if (comment.user_id === user.id) {
    return true;
  }

  if (user.role === "kierownik") {
    return projectContext.created_by_user_id === user.id;
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
