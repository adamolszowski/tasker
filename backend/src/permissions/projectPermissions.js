// Proste helpery do sprawdzania uprawnien przy projektach.
// Chodzi o to, zeby nie rozpisywac tych samych ifow w pieciu miejscach.

function isAdminLike(user) {
    return user.role === "administrator" || user.role === "superadmin";
}

function canViewProject(user , project, isMember = false) {
    if (!user || !project) {
        return false;
    }

     if (isAdminLike(user)) {
        return true;
     }

     if (user.role === "kierownik") {
        return project.created_by_user_id === user.sub || isMember;
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
    return project.created_by_user_id === user.sub;
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
} ;