// Kontroler do projektow.
// Tu jest logika request -> walidacja -> uprawnienia -> zapytania.

const sequelize = require("../db");
const {
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
} = require("../data/projectQueries");
const { findUserWithRoleById } = require("../data/projectQueries");
const{
  validateCreateProjectInput,
  validateUpdateProjectInput,
  validateProjectStatusInput,
  validateProjectMemberInput, 
} = require("../validators/projectValidators");
const {
    canViewProject,
  canCreateProject,
  canEditProject,
  canChangeProjectStatus,
  canManageProjectMembers,
} = require("../permissions/projectPermissions");

async function getProjectStatuses(req, res) {
    try {
        const status = await findProjectStatuses();

        return res.status(200).json({ statuses });
    } catch (error) {
        return res.status(500).json({
            message: "Błąd podczas pobierania statusów projektu.",
            error: error.message,
        });
    }
}

async function getProjects(req,res) {
     try {
        const  projects = await findProjectsForUser(req.auth);

        return res.status(200).json({ projects });
    } catch (error) {
        return res.status(500).json({
            message: "Błąd podczas pobierania projektów.",
            error: error.message,
        });
    }
}
    
async function createProjectHandler(req, res) {
 const validation = validateCreateProjectInput(req.body);
 
 if (validation.error) {
    return res.status(400).json({ message: validation.error });
 }

 if (!canCreateProject(req.auth)) {
    return res.status(403).json({
        message: "Brak Uprawnień do towrzenia projektu.",
    });
 }

 const transaction = await sequelize.transaction();

 try {
    const defaultStatus = await findDefaultProjectStatus();

    if (!defaultStatus) {
        await transaction.rollback();
        return res.status(500).json({
            message: "Brak domyślnego statusu projektu w bazie."
        });
    }

    const project = await createProject(
        {
            name: validation.data.name,
            description: validation.data.description,
            createdByUserId: req.auth.sub,
            statusId: defaultStatus.id,
        },
        transaction
    );

    await addProjectMember(
        {
            projectId: project.id,
            userId: req.auth.sub,
            addedByUserId: req.auth.sub,
        },
        transaction
    );

    await transaction.commit();

    const fullProject = await findProjectById(project.id);

    return res.status(201).json({
        message: "Projekt został utowrzony.",
        project: fullProject,
    }); 
} catch (error) {
    await transaction.rollback();

    return res.status(500).json({
        message: "Błąd podczas tworzenia projektu.",
        error: error.message,
    });
 }
}

async function updateProjectHandler(req , res) {
    const validation = validateUpdateProjectInput(req.body);

    if (validation.error) {
        return res.status(400).json({ message: validation.error });
    }

    const projectId = Number(req.params.id);

    if (!projectId || Number.isNaN(projectId)) {
        return res.status(400).json({
            message: "Nieprawidłowe ID projektu"
        });
    }
 
    const transaction = await sequelize.transaction();

    try{
        const project = await findProjectById(projectId, transaction);

        if (!project) {
            await transaction.rollback();
            return res.status(404).json({ message: "Projekt nie istnieje."});
        }

        if (!canEditProject(req.auth, project)) {
            await transaction.rollback();
            return res.status(403),json({
                message: "Brak uprawnień do edycji tego projektu",
            });
        }

        await updateProject(
            {
                projectId,
                name: validation.data.name,
                description: validation.data.description,
            },
            transaction
        );

        await transaction.commit();

        const fullProject = await findProjectById(projectId);

        return res.status(200).json({
            message: "Projekt został zaktualizowany.",
            project: fullProject,
        });
    } catch (error) {
 await transaction.rollback();

 return res.status(500).json({
    message: "Błąd podczas edycji projektu.",
    error: error.message,
 });
    }
}

async function changeProjectStatusHandler(req , res) {
    const validation = validateProjectStatusInput(req.body);

    if (validation.error) {
        return res.status(400).json({ message: validation.error});
    }

    const projectId = Number(req.params.id);

    if (!projectId || Number.isNaN(projectId)) {
        return res.status(400).json({
            message: "Nieprawidłowe ID projektu",
        });
    }

    const transaction = await sequelize.transaction();

    try {
        const project = await findProjectById(projectId, transaction);

        if (!project) {
            await transaction.rollback();
            return res.status(400).json({ message: "Projekt nie istnieje."});
        }

        if (!canChangeProjectStatus(req.auth, project)) {
            await transaction.rollback();
            return res.status(403).json({
                message: "Brak uprawnień do zmiany statusu tego projektu",
            });
        }

        const status = await findProjectStatusById(validation.data.statusId);

        if (!status) {
            await transaction.rollback();
            return res.status(400).json({ message: "Status projektu nie istnieje"});
        }

        await updateProjectStatus(
            {
                projectId,
                statusId: validation.data.statusId,
            },
            transaction
        );

        await transaction.commit();

        const fullProject = await findProjectById(projectId);

        return res.status(200).json({
            message: "Status projektu został zmieniony.",
            project: fullProject,
        });
    } catch (error) {
        await transaction.rollback();
    
        return res.status(500).json({
            message: "Błąd podczas zmiany statusu projektu projektu.",
            error: error.message,
        });
  }
}

async function getProjectMembersHandler(req, res) {
  const projectId = Number(req.params.id);

  if (!projectId || Number.isNaN(projectId)) {
    return res.status(400).json({
        message: "Nieprawidłowe ID projektu.",
    });
  }

  try {
    const project = await findProjectById(projectId);

    if (!project) {
        return res.status(404).json({ message: "Projekt nie istnieje."});
    }

    const member = await isUserProjectMember(projectId, req.auth.sub);

    if (!canViewProject(req.auth, project, member)) {
        return res.status(403).json({
            message: "Brak uprawnień do poglądu tego projektu.",
        });
    }

    const members = await findProjectMembers(projectId);

    return res.status(200).json({ members });
  } catch (error) {
    return res.status(500).json({
        message: "Błąd podczas pobierania członków projektu.",
        error: error.message,
    });
  }
}

async function addProjectMemberHandler(req, res) {
    const projectId = Number(req.params.id);
    const validation = validateProjectMemberInput(req.body);

    if (!projectId || Number.isNaN(projectId)) {
        return res.status(400).json({
            message: "Nieprawidłowe ID projektu",
        });
    }

    if (validation.error) {
        return res.status(400).json({ message: validation.error });
    }

    const transaction = await sequelize.transaction();

    try{
        const project = await findProjectById(projectId, transaction);

        if (!project) {
            await transaction.rollback();
            return res.status(404).json({ message: "Projekt nie istnieje."});
        }

        if (!canManageProjectMembers(req.auth, project)) {
      await transaction.rollback();
      return res.status(403).json({
        message: "Brak uprawnień do zarządzania członkami tego projektu.",
      });
    }

    const targetUser = await findUserWithRoleById(validation.data.userId);

    if (!targetUser) {
      await transaction.rollback();
      return res.status(404).json({ message: "Użytkownik nie istnieje." });
    }

    if (!targetUser.role_name) {
      await transaction.rollback();
      return res.status(409).json({
        message: "Nie można dodać użytkownika bez przypisanej roli.",
      });
    }

    const alreadyMember = await isUserProjectMember(projectId, targetUser.id);

    if (alreadyMember) {
      await transaction.rollback();
      return res.status(409).json({
        message: "Ten użytkownik już należy do projektu.",
      });
    }

    await addProjectMember(
      {
        projectId,
        userId: targetUser.id,
        addedByUserId: req.auth.sub,
      },
      transaction
    );

    await transaction.commit();

    const members = await findProjectMembers(projectId);

    return res.status(201).json({
      message: "Użytkownik został dodany do projektu.",
      members,
    });
  } catch (error) {
    await transaction.rollback();

    return res.status(500).json({
      message: "Błąd podczas dodawania użytkownika do projektu.",
      error: error.message,
    });
  }
}

async function removeProjectMemberHandler(req, res) {
  const projectId = Number(req.params.id);
  const userId = Number(req.params.userId);

  if (!projectId || Number.isNaN(projectId) || !userId || Number.isNaN(userId)) {
    return res.status(400).json({
      message: "Nieprawidłowe ID projektu lub użytkownika.",
    });
  }

  const transaction = await sequelize.transaction();

  try {
    const project = await findProjectById(projectId, transaction);

    if (!project) {
      await transaction.rollback();
      return res.status(404).json({ message: "Projekt nie istnieje." });
    }

    if (!canManageProjectMembers(req.auth, project)) {
      await transaction.rollback();
      return res.status(403).json({
        message: "Brak uprawnień do zarządzania członkami tego projektu.",
      });
    }

    if (project.created_by_user_id === userId) {
      await transaction.rollback();
      return res.status(409).json({
        message: "Nie można usunąć autora projektu z listy członków.",
      });
    }

    const member = await isUserProjectMember(projectId, userId);

    if (!member) {
      await transaction.rollback();
      return res.status(404).json({
        message: "Ten użytkownik nie należy do projektu.",
      });
    }

    await removeProjectMember(projectId, userId, transaction);
    await transaction.commit();

    const members = await findProjectMembers(projectId);

    return res.status(200).json({
      message: "Użytkownik został usunięty z projektu.",
      members,
    });
  } catch (error) {
    await transaction.rollback();

    return res.status(500).json({
      message: "Błąd podczas usuwania użytkownika z projektu.",
      error: error.message,
    });
  }
}

module.exports = {
  getProjectStatuses,
  getProjects,
  createProject: createProjectHandler,
  updateProject: updateProjectHandler,
  changeProjectStatus: changeProjectStatusHandler,
  getProjectMembers: getProjectMembersHandler,
  addProjectMember: addProjectMemberHandler,
  removeProjectMember: removeProjectMemberHandler,
};   
