// Zapytania związane z projektami i czlonkami projektów.
// Trzymamy tu tylko SQL i nic więcej.

const sequelize = require("../db");

async function findProjectStatuses() {
    const [rows] = await sequelize.query(
       `
    SELECT id, name
    FROM project_statuses
    ORDER BY id ASC
    `
);

 return rows;
}

async function findProjectStatusById(status_id) {
    const [rows] = await sequelize.query(
       `
    SELECT id, name
    FROM project_statuses
    WHERE id = :statusId
    LIMIT 1
    `,
    {
        replacements: { statusId },
    }
    );
    
    return rows[0] || null;
}

async function findDefaultProjectStatus() {
    const [rows] = await sequelize.query(
     `
    SELECT id, name
    FROM project_statuses
    WHERE LOWER(name) = 'w toku'
    LIMIT 1
    `
    );
    
    return rows[0] || null;
}

async function findProjectById(projectId, transaction = null) {
    const [rows] = await sequelize.query(
  `
    SELECT
      p.id,
      p.name,
      p.description,
      p.status_id,
      p.created_by_user_id,
      p.created_at,
      p.updated_at,
      ps.name AS status_name,
      u.first_name AS owner_first_name,
      u.last_name AS owner_last_name,
      (
        SELECT COUNT(*)
        FROM project_members pm
        WHERE pm.project_id = p.id
      )::int AS members_count
    FROM projects p
    JOIN project_statuses ps ON ps.id = p.status_id
    JOIN users u ON u.id = p.created_by_user_id
    WHERE p.id = :projectId
    LIMIT 1
    `,
    {
        replacements: { projectId },
        transaction,
    }
    );
    
    return rows[0] || null;
}

async function  findProjectsForUser(user) {
if (user.role === "administrator" || user.role === "superadmin") {
    const [rows] = await sequelize.query(
         `
      SELECT
        p.id,
        p.name,
        p.description,
        p.status_id,
        p.created_by_user_id,
        p.created_at,
        p.updated_at,
        ps.name AS status_name,
        u.first_name AS owner_first_name,
        u.last_name AS owner_last_name,
        (
          SELECT COUNT(*)
          FROM project_members pm
          WHERE pm.project_id = p.id
        )::int AS members_count
      FROM projects p
      JOIN project_statuses ps ON ps.id = p.status_id
      JOIN users u ON u.id = p.created_by_user_id
      ORDER BY p.created_at DESC
      `
    );

    return rows;
}

if (user.role === "kierownik") {
    const [rows] = await sequelize.query(
        `
      SELECT DISTINCT
        p.id,
        p.name,
        p.description,
        p.status_id,
        p.created_by_user_id,
        p.created_at,
        p.updated_at,
        ps.name AS status_name,
        u.first_name AS owner_first_name,
        u.last_name AS owner_last_name,
        (
          SELECT COUNT(*)
          FROM project_members pm2
          WHERE pm2.project_id = p.id
        )::int AS members_count
      FROM projects p
      JOIN project_statuses ps ON ps.id = p.status_id
      JOIN users u ON u.id = p.created_by_user_id
      LEFT JOIN project_members pm ON pm.project_id = p.id
      WHERE p.created_by_user_id = :userId OR pm.user_id = :userId
      ORDER BY p.created_at DESC
      `,
      {
        replacements: {userId: user.sub },
      }
    );
    
    return rows;
}

const [rows] = await sequelize.query(
    `
    SELECT
      p.id,
      p.name,
      p.description,
      p.status_id,
      p.created_by_user_id,
      p.created_at,
      p.updated_at,
      ps.name AS status_name,
      u.first_name AS owner_first_name,
      u.last_name AS owner_last_name,
      (
        SELECT COUNT(*)
        FROM project_members pm2
        WHERE pm2.project_id = p.id
      )::int AS members_count
    FROM projects p
    JOIN project_statuses ps ON ps.id = p.status_id
    JOIN users u ON u.id = p.created_by_user_id
    JOIN project_members pm ON pm.project_id = p.id
    WHERE pm.user_id = :userId
    ORDER BY p.created_at DESC
    `,
    {
        replacements: { userId: user.sub },
    }
);

return rows;
}

async function createProject({ name, description, createdByUserId, statusId }, transaction = null) {
const [rows] = await sequelize.query(
   `
    INSERT INTO projects (
      name,
      description,
      status_id,
      created_by_user_id
    )
    VALUES (
      :name,
      :description,
      :statusId,
      :createdByUserId
    )
    RETURNING id, name, description, status_id, created_by_user_id, created_at, updated_at
    `,
    {
        replacements: {
            name,
            description,
            statusId,
            createdByUserId,
        },
        transaction,
    }  
);

return rows[0] || null;
}

async function updateProject({ projectId, name , description}, transaction = null) {
    const [rows] = await sequelize.query(
       `
    UPDATE projects
    SET
      name = :name,
      description = :description,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = :projectId
    RETURNING id, name, description, status_id, created_by_user_id, created_at, updated_at
    `,  
    {
        replacements: {
            projectId,
            name,
            description,
        },
        transaction,
    }
);

    return rows[0] || null;
}

async function updateProjectStatus({ projectId, statusId}, transaction = null) {
    const [rows] = await sequelize.query(
          `
    UPDATE projects
    SET
      status_id = :statusId,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = :projectId
    RETURNING id, name, description, status_id, created_by_user_id, created_at, updated_at
    `,
    {
        replacements: {
            projectId,
            statusId,
        },
        transaction,
    }
    );

    return rows[0] || null;
}

async function findProjectMembers(projectId) {
    const [rows] = await sequelize.query(
        `
    SELECT
      pm.id,
      pm.project_id,
      pm.user_id,
      pm.added_by_user_id,
      pm.joined_at,
      u.first_name,
      u.last_name,
      u.email,
      u.phone,
      r.name AS role_name
    FROM project_members pm
    JOIN users u ON u.id = pm.user_id
    LEFT JOIN roles r ON r.id = u.role_id
    WHERE pm.project_id = :projectId
    ORDER BY pm.joined_at ASC
    `,
    {
        replacements: { projectId },
    }
    );

    return rows;
}

async function  isUserProjectMember(projectId, userId) {
    const [rows] = await sequelize.query(
       `
    SELECT id
    FROM project_members
    WHERE project_id = :projectId AND user_id = :userId
    LIMIT 1
    `,
    {
        replacements: {
            projectId,
            userId,
        },
    } 
    );

    return Boolean(rows[0]);
}

async function addProjectMember({ projectId, userId, addedByUserId}, transaction = null) {
    const [rows] = await sequelize.query(
 `
    INSERT INTO project_members (
      project_id,
      user_id,
      added_by_user_id
    )
    VALUES (
      :projectId,
      :userId,
      :addedByUserId
    )
    RETURNING id, project_id, user_id, added_by_user_id, joined_at
    `,
    {
        replacements: {
            projectId,
            userId,
            addedByUserId,
        },
        transaction,
    }
    );

    return rows[0] || null;
}

async function removeProjectMember(projectId, userId, transaction = null) {
    const [rows] = await sequelize.query(
        `
    DELETE FROM project_members
    WHERE project_id = :projectId AND user_id = :userId
    RETURNING id, project_id, user_id, added_by_user_id, joined_at
    `,
    {
        replacements: {
            projectId,
            userId,
        },
        transaction,
        } 
    );

    return rows[0] || null;
}

module.exports = {
    findProjectStatuses,
    findProjectStatusById,
    findDefaultProjectStatus,
    findProjectById,
    findProjectsForUser,
    createProject,
    updateProject,
    updateProjectStatus,
    findProjectMembers,
    isUserProjectMember,
    addProjectMember,
    removeProjectMember,
};
