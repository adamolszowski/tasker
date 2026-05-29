// plik odpowiada za przechowywanie funkcji ktore sprawdzaja czy dany uzytkownik moze cos zrobic

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

function canViewTask(user, projectContext, isProjectMember) {
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

function canCreateTask(user, projectContext) {
    if (!user || !projectContext) {
        return false;
    }

    if (isAdminLike(user)) {
        return true;
    }

    if (user.role === "kierownik") {
        return isProjectOwner(user, projectContext);
    }

    return false;
}

function canEditTask(user, projectContext) {
    return canCreateTask(user, projectContext);
}

function canDeleteTask(user, projectContext) {
    return canCreateTask(user, projectContext);
}

function canChangeTaskStatus(user, task, projectContext) {
    if (!user || !task || !projectContext) {
        return false;
    }

    if (isAdminLike(user)) {
        return true;
    }

    if (isDeletedProject(projectContext)) {
        return canUseDeletedProjectAsManager(user, projectContext);
    }

    if (user.role === "kierownik") {
        return isProjectOwner(user, projectContext);
    }

    if (user.role === "pracownik") {
        return Number(task.assigned_user_id) === getUserId(user);
    }

    return false;
}

module.exports = {
    canViewTask,
    canCreateTask,
    canEditTask,
    canDeleteTask,
    canChangeTaskStatus,
};