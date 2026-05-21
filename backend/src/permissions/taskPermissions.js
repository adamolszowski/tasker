// plik odpowiada za przechowywanie funkcji ktore sprawdzaja czy dany uzytkownik moze cos zrobic

// funkcja przyjmuje obiekt user, kontekst projektu, oraz to czy uzytkownik do niego nalezy
function canViewTask (user, projectContext, isProjectMember) {
    if (user.role === "administrator" || user.role === "superadmin") {
        return true; // dla admina i superadmina zawsze mozna wyswietlac
    }

    if (user.role === "kierownik") {
        return (
            projectContext.created_by_user_id === user.id ||
            isProjectMember === true
        ); // dla kierownika mozna jesli jest to projekt ktory stworzyl lub jest jego czlonkiem
    }

    if (user.role === "pracownik") {
        return isProjectMember === true; // dla pracownika mozna jesli jest czlonkiem projektu
    }

    return false; // jesli jest inaczej to nie mozna zobaczyc zadan
}


// funkcja sprawdza czy uzytkownik z obiektu user, w zaleznosci od kontekstu projektu
// moze utworzyc zadanie
function canCreateTask(user, projectContext) {
    if (user.role === "administrator" || user.role === "superadmin") {
        return true; // admin i superadmin zawsze moga
    }

    if (user.role === "kierownik") {
        return projectContext.created_by_user_id === user.id;
        // kierownik moze tylko w projektach ktore stworzyl
    }

    return false;
}

// bazujemy na canCreateTask bo logika wyglada tak samo
function canEditTask(user, projectContext) {
    return canCreateTask(user, projectContext);
}

// bazujemy na canCreateTask bo logika wyglada tak samo
function canDeleteTask(user, projectContext) {
    return canCreateTask(user, projectContext);
}

// badamy czy uzytkownik o danej roli mozne zmienic status podanego zadania w zaleznosci
// od kontekstu
function canChangeTaskStatus(user, task, projectContext) {
    if (user.role === "administrator" || user.role === "superadmin") {
        return true; // admin i superadmin zawsze moga
    }

    if (user.role === "kierownik") {
        return projectContext.created_by_user_id === user.id;
        // kierownik tylko wtedy jesli stworzyl ten projekt w ktorym jest zadanie
    }

    if (user.role === "pracownik") {
        return task.assigned_user_id === user.id;
        // pracownik tylko wtedy jesli to zadanie jest do niego przypisane
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
