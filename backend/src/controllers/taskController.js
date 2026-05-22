const sequelize = require("../db");
const {
    findTaskStatuses,
    findTaskPriorities,
    findDefaultTaskStatus,
    findDefaultTaskPriority,
    findProjectContextById,
    isUserProjectMember,
    findAssignableUsersForProject,
    findTaskById,
    findTasksForUser,
    createTask,
    updateTask,
    updateTaskStatus,
    deleteTask,
} = require("../data/taskQueries");
const {
    validateCreateTaskInput,
    validateUpdateTaskInput,
    validateTaskStatusInput,
    validateTaskFilters,
} = require("../validators/taskValidators");
const {
    canViewTask,
    canCreateTask,
    canEditTask,
    canDeleteTask,
    canChangeTaskStatus,
} = require("../permissions/taskPermissions");

// zamienia jeden wiersz zadania z bazy na bardziej czytelny obiekt dla kontrolera / frontendu
// przy okazji tworzy gotowe pole assignedUserName z imienia i nazwiska przypisanego do taska usera
function mapTaskRow(task) {
    return {
        id: task.id,
        title: task.title,
        description: task.description,
        deadline: task.deadline,
        projectId: task.project_id,
        projectName: task.project_name,
        assignedUserId: task.assigned_user_id,
        createdByUserId: task.created_by_user_id,
        statusId: task.status_id,
        statusName: task.status_name,
        priorityId: task.priority_id,
        priorityName: task.priority_name,
        createdAt: task.created_at,
        updatedAt: task.updated_at,
        assignedUserName:
            task.assigned_first_name || task.assigned_last_name
                ? `${task.assigned_first_name || ""} ${task.assigned_last_name || ""}`.trim() : null,
    };
}

// endpoint pobiera z bazy wszystkie dostepne statusy zadan
// po sukcesie zwraca status 200 i liste statusow, a przy bledzie zwraca 500
async function getTaskStatuses(req, res) {
    try {
        const statuses = await findTaskStatuses();
        return res.status(200).json({ statuses });
    } catch (error) {
        return res.status(500).json({
            message: "Blad podczas pobierania statusow zadan",
            error: error.message,
        });
    }
}

// endpoint pobiera z bazy wszystkie dostepne priorytety zadan
// po sukcesie zwraca status 200 i liste priorytetow, a przy bledzie zwraca 500
async function getTaskPriorities(req, res) {
    try {
        const priorities = await findTaskPriorities();
        return res.status(200).json({ priorities });
    } catch (error) {
        return res.status(500).json({
            message: "Błąd podczas pobierania priorytetów zadań.",
            error: error.message,
        });
    }
}

// pobieramy zadania
async function getTasks(req, res) {
    //sprawdzamy czy zapytanie z frontendu jest poprawne
    //z uzyciem funkcji walidujacej, porzadkuje ona dane np
    //"3" -> 3, "" -> null, np req.query wyglada tak
    //{
    //  projectId: "3",
    //  statusId: "",
    //  priorityId: "2",
    //  assignedUserId: "abc"
    //} to dzieki tej funkcji mamy w validation:
    //{
    //  data: {
    //      projectId: 3,
    //      statusId: null,
    //      priorityId: 2,
    //      assignedUserId: null
    //  }
    //}
    const validation = validateTaskFilters(req.query);

    try {
        // pobieramy zadania dla uzytkownika na podstawie jego id oraz roli oraz filtrow z requestu
        const tasks = await findTasksForUser({ id: req.auth.sub, role: req.auth.role, }, validation.data);

        return res.status(200).json({
            // przepuszczamy tablice przez .map() ktore przechodzi po kazdym jej elemencie
            // i tworzy nowa tablice z przerobionymi nazwami wartosci np project_id -> projectId
            // aby frontend dostal czytelniejsze pola
            tasks: tasks.map(mapTaskRow),
        });
    } catch (error) {
        return res.status(500).json({
            message: "Błąd podczas pobierania zadań.",
            error: error.message,
        });
    }
}

async function getProjectTasks(req, res) {
    const projectId = Number(req.params.projectId);

    // sprawdzamy poprawnosc podanego id projektu
    if (!projectId || Number.isNaN(projectId)) {
        return res.status(400).json({
            message: "nieprawidłowe ID projektu",
        });
    }

    // laczymy filtry z req.query z projectId z params, 
    // zeby walidacja dostala jeden wspolny obiekt
    const validation = validateTaskFilters({ ...req.query, projectId });

    try {
        const project = await findProjectContextById(projectId);

        // sprawdzamy czy projekt istnieje
        if (!project) {
            return res.status(404).json({
                message: "Projekt nie istnieje.",
            });
        }

        // sprawdzamy czy uzytkownik jest uczestnikiem projektu
        const isMember = await isUserProjectMember(projectId, req.auth.sub);

        // sprawdzamy czy uzytkownik ma uprawnienia do podgladu zadan tym projekcie
        if (!canViewTask({ id: req.auth.sub, role: req.auth.role }, project, isMember)) {
            return res.status(403).json({
                message: "Brak uprawnień do podglądu zadań w tym projekcie.",
            })
        }

        // szukamy zadan dla uzytkownika warunkujac to jego id, rolą oraz filtrami
        const tasks = await findTasksForUser(
            { id: req.auth.sub, role: req.auth.role }, validation.data
        );

        return res.status(200).json({
            // przepuszczamy tablice przez .map() ktore przechodzi po kazdym jej elemencie
            // i tworzy nowa tablice z przerobionymi nazwami wartosci np project_id -> projectId
            // aby frontend dostal czytelniejsze pola
            tasks: tasks.map(mapTaskRow),
        });
    } catch (error) {
        return res.status(500).json({
            message: "Błąd podczas pobierania zadań projektu.",
            error: error.message,
        })
    }
}

async function getTaskById(req, res) {
    const taskId = Number(req.params.id);

    // sprawdzamy poprawnosc id żądanego zadania
    if (!taskId || Number.isNaN(taskId)) {
        return res.status(400).json({
            message: "Nieprawidłowe ID zadania.",
        });
    }

    try {
        const task = await findTaskById(taskId);

        // sprawdzamy czy zadanie istnieje
        if (!task) {
            return res.status(404).json({
                message: "Zadanie nie istnieje.",
            });
        }

        // pobieramy dane o projekcie
        const project = await findProjectContextById(task.project_id);
        // sprawdzamy czy uzytkownik jest przypisany do projektu
        const isMember = await isUserProjectMember(task.project_id, req.auth.sub);

        //sprawdzamy czy uzytkownik moze zobaczyc dane zadanie na podstawie jego id
        //roli oraz tego czy jest członkiem projektu
        if (!canViewTask({ id: req.auth.sub, role: req.auth.role }, project, isMember)) {
            return res.status(403).json({
                message: "Brak uprawnień do podglądu tego zadania.",
            });
        }

        return res.status(200).json({
            // zmieniamy nazwy wartosci dla zadania dzieki funkcji mapTaskRow
            task: mapTaskRow(task),
        });

    } catch (error) {
        return res.status(500).json({
            message: "Błąd podczas pobierania zadania.",
            error: error.message,
        });
    }
}

async function createTaskHandler(req, res) {
    // sprawdzamy czy dane wejsciowe sa poprawne
    const validation = validateCreateTaskInput(req.body);

    // jesli nie sa to zwracamy błąd
    if (validation.error) {
        return res.status(400).json({
            message: validation.error,
        });
    }

    // otwieramy transakcje, czyli wszystko sie uda albo cofamy
    const transaction = await sequelize.transaction();

    try {
        //dane dotyczace zadania
        const input = validation.data;
        // pobieramy projekt w ramach tej samej transakcji, w ktorej potem tworzymy zadanie
        const project = await findProjectContextById(input.projectId, transaction);

        // sprawdzamy czy projekt istnieje
        if (!project) {
            await transaction.rollback();
            return res.status(404).json({ message: "Projekt nie istnieje." });
        }

        // sprawdzamy czy uzytkownik ma prawo do tworzenia zadania, na podstawie jego
        // id, roli oraz projektu w ktorym chce stworzyc zadanie
        if (!canCreateTask({ id: req.auth.sub, role: req.auth.role }, project)) {
            // w razie niepowodzenia cofamy zmiany w transakcji
            await transaction.rollback();
            return res.status(403).json({
                message: "Brak uprawnień do tworzenia zadania w tym projekcie.",
            });
        }

        if (input.assignedUserId) {
            // sprawdzamy czy uzytkownik ktoremu chcemy przypisac zadanie nalezy do tego projektu
            const isMember = await isUserProjectMember(input.projectId, input.assignedUserId, transaction);
            if (!isMember) {
                // jesli nie jest to cofamy zmiany
                await transaction.rollback();
                return res.status(409).json({
                    message: "Nie można przypisać zadania do użytkownika spoza projektu",
                })
            }
        }

        // szukamy domyslnego statusu zadania
        const defaultStatus = await findDefaultTaskStatus(transaction);
        if (!defaultStatus) {
            await transaction.rollback();
            return res.status(409).json({
                message: "Brak domyślnego statusu zadania w bazie.",
            });
        }

        let priorityId = input.priorityId;
        if (!priorityId) {
            const defaultPriority = await findDefaultTaskPriority(transaction);
            if (!defaultPriority) {
                await transaction.rollback();
                return res.status(409).json({
                message: "Brak domyślnego priorytetu zadania w bazie.",
                });
            }
            priorityId = defaultPriority.id;
        }

        // tworzymy obiekt danych do wstawienia, bierzemy wszystko z input, dodajemy/nadpisujemy 
        // priorytet, status oraz kto to zadanie zrobił, to wszystko w ramach transakcji
        const created = await createTask({ ...input, priorityId, statusId: defaultStatus.id,
            createdByUserId: req.auth.sub,
        }, transaction);

        // pobieramy utworzone zadanie
        const task = await findTaskById(created.id, transaction);

        // zatwierdzamy transakcje
        await transaction.commit();

        // zwracamy zadanie ze zmienionymi pod frontend nazwami wartosci czyli np
        // task_id -> taskId
        return res.status(201).json({
            message: "Zadanie zostało utworzone.",
            task: mapTaskRow(task),
        });
    } catch (error) {
        await transaction.rollback();
        return res.status(500).json({
            message: "Błąd podczas tworzenia zadania.",
            error: error.message,
        });
    }
}

// endpoint do usuwania zadania
async function deleteTaskHandler(req, res) {
  // bierzemy id zadania z adresu i probujemy zamienic je na liczbe
  const taskId = Number(req.params.id);

  // jesli id jest zle albo nie jest poprawna liczba to przerywamy
  if (!taskId || Number.isNaN(taskId)) {
    return res.status(400).json({ message: "Nieprawidłowe ID zadania." });
  }

  // otwieramy transakcje, czyli albo wszystko sie uda albo cofamy zmiany
  const transaction = await sequelize.transaction();

  try {
    // pobieramy zadanie w ramach tej samej transakcji
    const task = await findTaskById(taskId, transaction);

    // jak zadanie nie istnieje to cofamy transakcje i zwracamy blad
    if (!task) {
      await transaction.rollback();
      return res.status(404).json({ message: "Zadanie nie istnieje." });
    }

    // pobieramy projekt do ktorego nalezy to zadanie
    const project = await findProjectContextById(task.project_id, transaction);

    // sprawdzamy czy zalogowany user ma prawo usunac to zadanie
    // decyzja zalezy od jego id, roli i kontekstu projektu
    if (!canDeleteTask({ id: req.auth.sub, role: req.auth.role }, project)) {
      await transaction.rollback();
      return res.status(403).json({
        message: "Brak uprawnień do usunięcia tego zadania.",
      });
    }

    // jesli wszystko jest okej to usuwamy zadanie
    await deleteTask(taskId, transaction);

    // zatwierdzamy transakcje
    await transaction.commit();

    // zwracamy odpowiedz ze zadanie zostalo usuniete
    return res.status(200).json({
      message: "Zadanie zostało usunięte.",
    });
  } catch (error) {
    // jak cos sie wywali po drodze to cofamy transakcje
    await transaction.rollback();

    // i zwracamy blad serwera
    return res.status(500).json({
      message: "Błąd podczas usuwania zadania.",
      error: error.message,
    });
  }
}

// endpoint do aktualizacji zadania
async function updateTaskHandler(req, res) {
  // bierzemy id zadania z adresu i probujemy zamienic je na liczbe
  const taskId = Number(req.params.id);

  // jesli id jest zle albo nie jest poprawna liczba to przerywamy
  if (!taskId || Number.isNaN(taskId)) {
    return res.status(400).json({ message: "Nieprawidłowe ID zadania." });
  }

  // sprawdzamy czy dane przeslane z frontu sa poprawne
  const validation = validateUpdateTaskInput(req.body);

  // jesli walidacja zwrocila blad to od razu konczymy
  if (validation.error) {
    return res.status(400).json({ message: validation.error });
  }

  // otwieramy transakcje, czyli wszystko sie uda albo cofamy zmiany
  const transaction = await sequelize.transaction();

  try {
    // pobieramy zadanie w ramach tej samej transakcji
    const task = await findTaskById(taskId, transaction);

    // jesli zadanie nie istnieje to cofamy transakcje i zwracamy blad
    if (!task) {
      await transaction.rollback();
      return res.status(404).json({ message: "Zadanie nie istnieje." });
    }

    // pobieramy projekt do ktorego nalezy to zadanie
    const project = await findProjectContextById(task.project_id, transaction);

    // sprawdzamy czy zalogowany user ma prawo edytowac to zadanie
    // decyzja zalezy od jego id, roli i kontekstu projektu
    if (!canEditTask({ id: req.auth.sub, role: req.auth.role }, project)) {
      await transaction.rollback();
      return res.status(403).json({
        message: "Brak uprawnień do edycji tego zadania.",
      });
    }

    // jesli w danych do edycji podano przypisanego usera, to sprawdzamy
    // czy ten user nalezy do projektu w ktorym jest zadanie
    if (validation.data.assignedUserId) {
      const isMember = await isUserProjectMember(
        task.project_id,
        validation.data.assignedUserId,
        transaction
      );

      // jesli nie nalezy do projektu to cofamy transakcje i zwracamy blad
      if (!isMember) {
        await transaction.rollback();
        return res.status(409).json({
          message: "Nie można przypisać zadania do użytkownika spoza projektu.",
        });
      }
    }

    // aktualizujemy zadanie na podstawie poprawnych danych po walidacji
    await updateTask(taskId, validation.data, transaction);

    // po aktualizacji pobieramy zadanie jeszcze raz, zeby miec aktualne dane
    const updatedTask = await findTaskById(taskId, transaction);

    // zatwierdzamy transakcje
    await transaction.commit();

    // zwracamy odpowiedz ze zadanie zostalo zaktualizowane
    // przy okazji mapujemy pola na bardziej czytelne dla frontendu
    return res.status(200).json({
      message: "Zadanie zostało zaktualizowane.",
      task: mapTaskRow(updatedTask),
    });
  } catch (error) {
    // jak cos sie wywali po drodze to cofamy transakcje
    await transaction.rollback();

    // i zwracamy blad serwera
    return res.status(500).json({
      message: "Błąd podczas aktualizacji zadania.",
      error: error.message,
    });
  }
}

// endpoint do zmiany statusu zadania
async function changeTaskStatusHandler(req, res) {
  // bierzemy id zadania z adresu i probujemy zamienic je na liczbe
  const taskId = Number(req.params.id);

  // jesli id jest zle albo nie jest poprawna liczba to przerywamy
  if (!taskId || Number.isNaN(taskId)) {
    return res.status(400).json({ message: "Nieprawidłowe ID zadania." });
  }

  // sprawdzamy czy status podany z frontu jest poprawny
  const validation = validateTaskStatusInput(req.body);

  // jesli walidacja zwrocila blad to od razu konczymy
  if (validation.error) {
    return res.status(400).json({ message: validation.error });
  }

  // otwieramy transakcje, czyli wszystko sie uda albo cofamy zmiany
  const transaction = await sequelize.transaction();

  try {
    // pobieramy zadanie w ramach tej samej transakcji
    const task = await findTaskById(taskId, transaction);

    // jesli zadanie nie istnieje to cofamy transakcje i zwracamy blad
    if (!task) {
      await transaction.rollback();
      return res.status(404).json({ message: "Zadanie nie istnieje." });
    }

    // pobieramy projekt do ktorego nalezy to zadanie
    const project = await findProjectContextById(task.project_id, transaction);

    // sprawdzamy czy zalogowany user ma prawo zmienic status tego zadania
    // decyzja zalezy od jego id, roli, samego zadania oraz projektu
    if (!canChangeTaskStatus({ id: req.auth.sub, role: req.auth.role }, task, project)) {
      await transaction.rollback();
      return res.status(403).json({
        message: "Brak uprawnień do zmiany statusu tego zadania.",
      });
    }

    // jesli wszystko jest okej to zmieniamy status zadania
    await updateTaskStatus(taskId, validation.data.statusId, transaction);

    // po zmianie pobieramy zadanie jeszcze raz, zeby miec aktualne dane
    const updatedTask = await findTaskById(taskId, transaction);

    // zatwierdzamy transakcje
    await transaction.commit();

    // zwracamy odpowiedz ze status zostal zmieniony
    // przy okazji mapujemy pola na bardziej czytelne dla frontendu
    return res.status(200).json({
      message: "Status zadania został zmieniony.",
      task: mapTaskRow(updatedTask),
    });
  } catch (error) {
    // jak cos sie wywali po drodze to cofamy transakcje
    await transaction.rollback();

    // i zwracamy blad serwera
    return res.status(500).json({
      message: "Błąd podczas zmiany statusu zadania.",
      error: error.message,
    });
  }
}

// endpoint do pobierania listy uzytkownikow, ktorych mozna przypisac do zadania w danym projekcie
async function getAssignableUsers(req, res) {
  // bierzemy id projektu z adresu i probujemy zamienic je na liczbe
  const projectId = Number(req.params.projectId);

  // jesli id jest zle albo nie jest poprawna liczba to przerywamy
  if (!projectId || Number.isNaN(projectId)) {
    return res.status(400).json({ message: "Nieprawidłowe ID projektu." });
  }

  try {
    // pobieramy projekt z bazy po jego id
    const project = await findProjectContextById(projectId);

    // jesli projekt nie istnieje to zwracamy blad
    if (!project) {
      return res.status(404).json({ message: "Projekt nie istnieje." });
    }

    // sprawdzamy czy zalogowany user ma prawo pobrac liste osob do przypisania
    // tutaj bazujemy na tej samej logice co przy tworzeniu zadania
    if (!canCreateTask({ id: req.auth.sub, role: req.auth.role }, project)) {
      return res.status(403).json({
        message: "Brak uprawnień do pobrania listy przypisań dla tego projektu.",
      });
    }

    // pobieramy z bazy uzytkownikow ktorzy naleza do tego projektu
    const users = await findAssignableUsersForProject(projectId);

    // zwracamy liste userow do frontu
    return res.status(200).json({ users });
  } catch (error) {
    // jesli cos sie wywali po drodze to zwracamy blad serwera
    return res.status(500).json({
      message: "Błąd podczas pobierania użytkowników projektu.",
      error: error.message,
    });
  }
}

module.exports = {
  getTaskStatuses,
  getTaskPriorities,
  getTasks,
  getProjectTasks,
  getTaskById,
  createTask: createTaskHandler,
  updateTask: updateTaskHandler,
  deleteTask: deleteTaskHandler,
  changeTaskStatus: changeTaskStatusHandler,
  getAssignableUsers,
};