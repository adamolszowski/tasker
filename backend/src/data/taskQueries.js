const sequelize = require("../db");
const { TaskStatus, TaskPriority } = require("../models");

// Statusy i priorytety zadań pobieramy przez modele Sequelize ORM.
async function findTaskStatuses() {
    return TaskStatus.findAll({
        attributes: ["id", "name"],
        order: [["id", "ASC"]],
        raw: true,
    });
}

async function findTaskPriorities() {
    return TaskPriority.findAll({
        attributes: ["id", "name"],
        order: [["id", "ASC"]],
        raw: true,
    });
}

async function findDefaultTaskStatus(transaction = null) {
    return TaskStatus.findOne({
        attributes: ["id", "name"],
        where: { name: "Do zrobienia" },
        transaction,
        raw: true,
    });
}

async function findDefaultTaskPriority(transaction = null) {
    return TaskPriority.findOne({
        attributes: ["id", "name"],
        where: { name: "średni" },
        transaction,
        raw: true,
    });
}

// zapytanie do zwracania informacji o projekcie poprzez podanie id projektu
// funkcja moze dostac transakcje, ale nie musi, może zwrócić null
async function findProjectContextById(projectId, transaction = null) {
    const [rows] = await sequelize.query(
        // left join na wypadek gdyby projekt nie mial statusu,
        // gdyby byl inner to projekt bylby zwrocony tylko wtedy gdy mialby status
        `
        SELECT
            p.id,
            p.name,
            p.description,
            p.created_by_user_id,
            p.status_id,
            ps.name AS status_name
        FROM projects p
        LEFT JOIN project_statuses ps ON ps.id = p.status_id
        WHERE p.id = :projectId
        LIMIT 1
        `, {
        replacements: {
            projectId: projectId,
        },
        transaction,
    }
    );

    return rows[0] || null;
}

// zapytanie do zwracania informacji o tym czy uzytkownik o podanym id
// jest czlonkiem projektu o danym id, SELECT 1 bo jak bedzie taki uzytkownik to
// zwrocimy jeden wiersz z wartoscia 1, funkcja zwraca true jesli rows.length > 0
// lub false jesli rows.length = 0
async function isUserProjectMember(projectId, userId, transaction = null) {
    const [rows] = await sequelize.query(
        `
        SELECT 1
        FROM project_members
        WHERE project_id = :projectId AND user_id = :userId
        LIMIT 1
        `, {
        replacements: {
            projectId: projectId,
            userId: userId,
        },
        transaction,
    }
    );

    return rows.length > 0
}

//zapytanie do zwracania uzytkownikow ktorych mozna przypisac do projektu
//funkcja przyjmuje projectId, sortowanie najpierw po nazwiskach, potem po
//imieniu, a na koncu po id, jesli imie lub nazwisko = NULL to taki rekord
//ląduje na koncu
async function findAssignableUsersForProject(projectId) {
    const [rows] = await sequelize.query(
        `
        SELECT
            u.id,
            u.first_name,
            u.last_name,
            u.email,
            u.phone,
            r.name AS role_name
        FROM project_members pm
        JOIN users u ON u.id = pm.user_id
        JOIN roles r ON r.id = u.role_id
        WHERE pm.project_id = :projectId
        ORDER BY u.last_name ASC NULLS LAST, u.first_name ASC NULLS LAST, u.id ASC
        `, {
        replacements: {
            projectId: projectId,
        },
    }
    );

    return rows;
}


//zapytanie zwraca wszystkie informacje o zadaniu poprzez przekazanie taskId
//moze przyjmowac transackje, zwraca jedeno zadanie lub null, JOIN bo te
//rekordy powinny istniec dla danego zadania
async function findTaskById(taskId, transaction = null) {
    const [rows] = await sequelize.query(
        `
    SELECT
      t.id,
      t.title,
      t.description,
      t.deadline,
      t.project_id,
      t.assigned_user_id,
      t.created_by_user_id,
      t.status_id,
      t.priority_id,
      t.created_at,
      t.updated_at,
      ts.name AS status_name,
      tp.name AS priority_name,
      p.name AS project_name,
      p.created_by_user_id AS project_owner_id,
      au.first_name AS assigned_first_name,
      au.last_name AS assigned_last_name,
      cu.first_name AS creator_first_name,
      cu.last_name AS creator_last_name
    FROM tasks t
    JOIN task_statuses ts ON ts.id = t.status_id
    JOIN task_priorities tp ON tp.id = t.priority_id
    JOIN projects p ON p.id = t.project_id
    LEFT JOIN users au ON au.id = t.assigned_user_id
    LEFT JOIN users cu ON cu.id = t.created_by_user_id
    WHERE t.id = :taskId
    LIMIT 1
    `,
        {
            replacements: {
                taskId: taskId
            },
            transaction,
        }
    );

    return rows[0] || null;
}


// pobieramy liste zadan z bazy dla danego uzytkownika, lista jest dopasowana do filtrow oraz uprawnien
// przyjmuje obiekt user, z ktorego znamy id usera oraz jego role, oraz obiekt filtrow ktory mowi
// zadanie z jakiego projektu, jaki status za, jaki priorytet zdania oraz jaki uzytkownik jest do niego przypisany
async function findTasksForUser(user, filters = {}) {
    //tablica warunkow np
    //t.project_id = :projectId
    //t.status_id = :statusId
    const conditions = [];

    //obiekt podmian np
    //replacements.projectId = 3;
    //replacements.statusId = 2;
    const replacements = {};

    const activeProjectCondition = "LOWER(ps.name) NOT IN ('usuniety', 'usunięty')";

    //w tych ifach wstawiamy do conditions i replacements wartosci w zaleznosci
    //od tego co jest w filtrze
    if (filters.projectId) {
        conditions.push("t.project_id = :projectId");
        replacements.projectId = filters.projectId;
    }

    if (filters.statusId) {
        conditions.push("t.status_id = :statusId");
        replacements.statusId = filters.statusId;
    }

    if (filters.priorityId) {
        conditions.push("t.priority_id = :priorityId");
        replacements.priorityId = filters.priorityId;
    }

    if (filters.assignedUserId) {
        conditions.push("t.assigned_user_id = :assignedUserId");
        replacements.assignedUserId = filters.assignedUserId;
    }

    // sprawdzamy czy istnieje taki rekord w project_members, który potwierdza, 
    // że ten użytkownik należy do projektu tego zadania
    // pracownik widzi tylko zadania z projektow do ktorych nalezy
    // do warunkow trafia caly exists() a do podmianek :currentUserId
    if (user.role === "pracownik") {
        conditions.push(
            `
            EXISTS (
                SELECT 1
                FROM project_members pm
                WHERE pm.project_id = t.project_id AND pm.user_id = :currentUserId
            )
            `
        );

        conditions.push(activeProjectCondition);
        replacements.currentUserId = user.id;
    }

    // podobnie jak dla pracownika z tym ze dodatkowo sprawdzamy sytuacje gdzie
    // projekt zostal stworzony przez uzytkownika o danym id i 
    // czy nie jest to wlasnie id kierownika, wtedy tez wyswietlamy zadania
    if (user.role === "kierownik") {
        conditions.push(`
        (
            p.created_by_user_id = :currentUserId
            OR (
                ${activeProjectCondition}
                AND EXISTS (
                    SELECT 1
                    FROM project_members pm
                    WHERE pm.project_id = t.project_id AND pm.user_id = :currentUserId
                )
            )
        )
        `);

        replacements.currentUserId = user.id;
    }

    // zbudowanie WHERE, laczymy wszystko z tablicy conditions wstawiajac miedzy te
    // warunki AND, jak nie ma nic w tablicy to nie ma warunkow
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    //left join poniewaz zadanie moze byc jeszcze nieprzypisane do uzytkownika

    const [rows] = await sequelize.query(
        `
        SELECT
            t.id,
            t.title,
            t.description,
            t.deadline,
            t.project_id,
            t.assigned_user_id,
            t.created_by_user_id,
            t.status_id,
            t.priority_id,
            t.created_at,
            t.updated_at,
            ts.name AS status_name,
            tp.name AS priority_name,
            p.name AS project_name,
            p.created_by_user_id AS project_owner_id,
            au.first_name AS assigned_first_name,
            au.last_name AS assigned_last_name
        FROM tasks t
        JOIN task_statuses ts ON ts.id = t.status_id
        JOIN task_priorities tp ON tp.id = t.priority_id
        JOIN projects p ON p.id = t.project_id
        JOIN project_statuses ps ON ps.id = p.status_id
        LEFT JOIN users au ON au.id = t.assigned_user_id
        ${whereClause}
        ORDER BY t.created_at DESC, t.id DESC
        `, {
        replacements,
    }
    );

    return rows;
}

// tworzymy zadanie na podstawie danych z obiektu data
// przyjmujemy transkacje, do rows zwracamy id utworzonego zadania
// funkcja zwraca wlasnie to lub null
async function createTask(data, transaction) {
    const [rows] = await sequelize.query(
        `
    INSERT INTO tasks (
      title,
      description,
      deadline,
      project_id,
      assigned_user_id,
      created_by_user_id,
      status_id,
      priority_id
    )
    VALUES (
      :title,
      :description,
      :deadline,
      :projectId,
      :assignedUserId,
      :createdByUserId,
      :statusId,
      :priorityId
    )
    RETURNING id
    `,
        {
            replacements: {
                title: data.title,
                description: data.description,
                deadline: data.deadline,
                projectId: data.projectId,
                assignedUserId: data.assignedUserId,
                createdByUserId: data.createdByUserId,
                statusId: data.statusId,
                priorityId: data.priorityId,
            },
            transaction,
        }
    );

    return rows[0] || null;
}

// funkcja do aktualizacji zadania, podajemy id zadania, obiekt danych zadania
// oraz uzywamy transakcji, zwracamy id zaktualizowanego zadania lub null
async function updateTask(taskId, data, transaction) {
    const [rows] = await sequelize.query(
        `
    UPDATE tasks
    SET
      title = :title,
      description = :description,
      deadline = :deadline,
      assigned_user_id = :assignedUserId,
      priority_id = :priorityId,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = :taskId
    RETURNING id
    `,
        {
            replacements: {
                taskId: taskId,
                title: data.title,
                description: data.description,
                deadline: data.deadline,
                assignedUserId: data.assignedUserId,
                priorityId: data.priorityId,
            },
            transaction,
        }
    );

    return rows[0] || null;
}

// funkcja do akualizacji statusu zadania oraz kiedy zostalo to 
// zaktualizowane, podajemy id zadania oraz id statusu
// uzywamy transakcji, zwracamy albo id tego zadania albo null
async function updateTaskStatus(taskId, statusId, transaction) {
    const [rows] = await sequelize.query(
        `
        UPDATE tasks
        SET
        status_id = :statusId,
        updated_at = CURRENT_TIMESTAMP
        WHERE id = :taskId
        RETURNING id
        `,
            {
                replacements: {
                    taskId: taskId,
                    statusId: statusId
                },
                transaction,
            }
    );

    return rows[0] || null;
}

// funkcja do usuwania zadania poprzez podanie jego id 
async function deleteTask(taskId, transaction) {
  await sequelize.query(
    `
    DELETE FROM tasks
    WHERE id = :taskId
    `,
    {
      replacements: { taskId },
      transaction,
    }
  );
}

// eksport funkcji aby mozna bylo ich uzyc gdzies indziej
module.exports = {
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
};
