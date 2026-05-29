// Proste helpery do sprawdzania uprawnien przy projektach.
// Chodzi o to, zeby nie rozpisywac tych samych ifow w pieciu miejscach.

function isAdminLike(user) {
    return user.role === "administrator" || user.role === "superadmin";
}

function getUserId(user) {
    return Number(user?.sub ?? user?.id);
}

function isProjectOwner(user, project) {
    return Number(project.created_by_user_id) === getUserId(user);
}

function isDeletedProject(project) {
    const statusName = String(project?.status_name || project?.statusName || "")
        .trim()
        .toLowerCase();

    return statusName === "usuniety" || statusName === "usunięty";
}

function canViewProject(user, project, isMember = false) {
    if (!user || !project) {
        return false;
    }

    if (isAdminLike(user)) {
        return true;
    }

    if (isDeletedProject(project)) {
        return user.role === "kierownik" && isProjectOwner(user, project);
    }

    if (user.role === "kierownik") {
        return isProjectOwner(user, project) || isMember;
    }

    if (user.role === "pracownik") {
        return isMember;
    }

    return false;
}

function canCreateProject(user) {
    if (!user) {
        return false;
    }

    return (
        user.role === "kierownik" ||
        user.role === "administrator" ||
        user.role === "superadmin"
    );
}

function canEditProject(user, project) {
    if (!user || !project) {
        return false;
    }

    if (isAdminLike(user)) {
        return true;
    }

    if (user.role === "kierownik") {
        return isProjectOwner(user, project);
    }

    return false;
}

function canChangeProjectStatus(user, project) {
    return canEditProject(user, project);
}

function canManageProjectMembers(user, project) {
    return canEditProject(user, project);
}

module.exports = {
    canViewProject,
    canCreateProject,
    canEditProject,
    canChangeProjectStatus,
    canManageProjectMembers,
};