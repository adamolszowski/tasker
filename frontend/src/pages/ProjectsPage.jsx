import React, { useEffect, useMemo, useState } from "react";
import Card from "react-bootstrap/Card";
import Alert from "react-bootstrap/Alert";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Badge from "react-bootstrap/Badge";
import Spinner from "react-bootstrap/Spinner";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import ProjectForm from "../components/projects/ProjectForm";
import ProjectCard from "../components/projects/ProjectCard";
import ProjectMembersPanel from "../components/projects/ProjectMembersPanel";
import {
  getProjects,
  getProjectStatuses,
  createProject,
  updateProject,
  changeProjectStatus,
  getProjectMembers,
  addProjectMember,
  removeProjectMember,
  getUsersDirectory,
} from "../api/projectsApi";

function ProjectsPage({ authToken, authenticatedUser }) {
  const [projects, setProjects] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [users, setUsers] = useState([]);
  const [members, setMembers] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);
  const [isMembersLoading, setIsMembersLoading] = useState(false);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [removingUserId, setRemovingUserId] = useState(null);
  const [statusChangingProjectId, setStatusChangingProjectId] = useState(null);
  const [formMode, setFormMode] = useState(null);
  const [editingProject, setEditingProject] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const isAdminLike =
    authenticatedUser?.role === "administrator" ||
    authenticatedUser?.role === "superadmin";

  const canCreate = authenticatedUser?.role === "kierownik" || isAdminLike;

  const resetMessages = () => {
    setErrorMessage("");
    setSuccessMessage("");
  };

  const canEditProject = (project) => {
    if (!authenticatedUser || !project) {
      return false;
    }

    if (isAdminLike) {
      return true;
    }

    return (
      authenticatedUser.role === "kierownik" &&
      project.created_by_user_id === authenticatedUser.id
    );
  };

  const fetchProjectsData = async () => {
    const [projectsData, statusesData] = await Promise.all([
      getProjects(authToken),
      getProjectStatuses(authToken),
    ]);

    setProjects(projectsData.projects || []);
    setStatuses(statusesData.statuses || []);
  };

  const fetchUsersData = async () => {
    if (!canCreate) {
      setUsers([]);
      return;
    }

    const usersData = await getUsersDirectory(authToken);
    setUsers(usersData.users || []);
  };

  useEffect(() => {
    const loadData = async () => {
      if (!authenticatedUser || !authToken) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        resetMessages();
        await Promise.all([fetchProjectsData(), fetchUsersData()]);
      } catch (error) {
        setErrorMessage(error.message || "Nie udało się pobrać projektów.");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [authToken, authenticatedUser?.id]);

  const filteredProjects = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) {
      return projects;
    }

    return projects.filter((project) => {
      const owner = `${project.owner_first_name || ""} ${project.owner_last_name || ""}`
        .trim()
        .toLowerCase();

      return (
        project.name.toLowerCase().includes(query) ||
        (project.description || "").toLowerCase().includes(query) ||
        (project.status_name || "").toLowerCase().includes(query) ||
        owner.includes(query)
      );
    });
  }, [projects, searchTerm]);

  const openCreateForm = () => {
    resetMessages();
    setFormMode("create");
    setEditingProject(null);
  };

  const openEditForm = (project) => {
    resetMessages();
    setFormMode("edit");
    setEditingProject(project);
  };

  const closeForm = () => {
    setFormMode(null);
    setEditingProject(null);
  };

  const handleFormSubmit = async (payload) => {
    try {
      setIsFormSubmitting(true);
      resetMessages();

      if (formMode === "edit" && editingProject) {
        const data = await updateProject(authToken, editingProject.id, payload);
        setProjects((prev) =>
          prev.map((project) =>
            project.id === editingProject.id ? data.project : project
          )
        );
        setSuccessMessage(data.message || "Projekt został zaktualizowany.");
      } else {
        const data = await createProject(authToken, payload);
        setProjects((prev) => [data.project, ...prev]);
        setSuccessMessage(data.message || "Projekt został utworzony.");
      }

      closeForm();
    } catch (error) {
      setErrorMessage(error.message || "Nie udało się zapisać projektu.");
    } finally {
      setIsFormSubmitting(false);
    }
  };

  const handleChangeStatus = async (projectId, statusId) => {
    try {
      setStatusChangingProjectId(projectId);
      resetMessages();

      const data = await changeProjectStatus(authToken, projectId, { statusId });

      setProjects((prev) =>
        prev.map((project) => (project.id === projectId ? data.project : project))
      );

      if (selectedProject?.id === projectId) {
        setSelectedProject(data.project);
      }

      setSuccessMessage(data.message || "Status projektu został zmieniony.");
    } catch (error) {
      setErrorMessage(error.message || "Nie udało się zmienić statusu projektu.");
    } finally {
      setStatusChangingProjectId(null);
    }
  };

  const handleOpenMembers = async (project) => {
    try {
      setSelectedProject(project);
      setIsMembersLoading(true);
      resetMessages();

      const data = await getProjectMembers(authToken, project.id);
      setMembers(data.members || []);
    } catch (error) {
      setErrorMessage(error.message || "Nie udało się pobrać członków projektu.");
      setMembers([]);
    } finally {
      setIsMembersLoading(false);
    }
  };

  const handleAddMember = async (userId) => {
    if (!selectedProject) {
      return;
    }

    try {
      setIsAddingMember(true);
      resetMessages();

      const data = await addProjectMember(authToken, selectedProject.id, { userId });
      setMembers(data.members || []);
      setSuccessMessage(data.message || "Użytkownik został dodany do projektu.");

      await fetchProjectsData();
    } catch (error) {
      setErrorMessage(error.message || "Nie udało się dodać użytkownika do projektu.");
    } finally {
      setIsAddingMember(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!selectedProject) {
      return;
    }

    try {
      setRemovingUserId(userId);
      resetMessages();

      const data = await removeProjectMember(authToken, selectedProject.id, userId);
      setMembers(data.members || []);
      setSuccessMessage(data.message || "Użytkownik został usunięty z projektu.");

      await fetchProjectsData();
    } catch (error) {
      setErrorMessage(error.message || "Nie udało się usunąć użytkownika z projektu.");
    } finally {
      setRemovingUserId(null);
    }
  };

  if (!authenticatedUser) {
    return (
      <Alert variant="warning">
        Musisz być zalogowany, aby zobaczyć projekty.
      </Alert>
    );
  }

  return (
    <div>
      <Card className="mb-4 border">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-3">
            <div>
              <h2 className="mb-1">PROJEKTY</h2>
              <p className="text-muted mb-0">
                Lista projektów dostępnych dla zalogowanego użytkownika
              </p>
            </div>

            <div className="d-flex align-items-center gap-2">
              <Badge bg="light" text="dark" className="border px-3 py-2">
                Projekty: {projects.length}
              </Badge>

              {canCreate && (
                <Button variant="dark" onClick={openCreateForm}>
                  Nowy projekt
                </Button>
              )}
            </div>
          </div>

          <Form.Control
            style={{ maxWidth: "420px" }}
            type="text"
            placeholder="Szukaj projektu..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </Card.Body>
      </Card>

      {errorMessage && (
        <Alert variant="danger" className="mb-3">
          {errorMessage}
        </Alert>
      )}

      {successMessage && (
        <Alert variant="success" className="mb-3">
          {successMessage}
        </Alert>
      )}

      {formMode && (
        <ProjectForm
          mode={formMode}
          initialProject={editingProject}
          onSubmit={handleFormSubmit}
          onCancel={closeForm}
          isSubmitting={isFormSubmitting}
        />
      )}

      {isLoading ? (
        <Card className="border">
          <Card.Body className="text-center py-4">
            <Spinner className="me-2" />
            Ładowanie projektów...
          </Card.Body>
        </Card>
      ) : filteredProjects.length === 0 ? (
        <Alert variant="secondary">Brak projektów do wyświetlenia.</Alert>
      ) : (
        <Row className="g-3">
          {filteredProjects.map((project) => (
            <Col key={project.id} md={6} xl={4}>
              <ProjectCard
                project={project}
                statuses={statuses}
                canEdit={canEditProject(project)}
                canManageMembers={canEditProject(project)}
                isStatusSubmitting={statusChangingProjectId === project.id}
                isMembersOpen={selectedProject?.id === project.id}
                onEdit={openEditForm}
                onOpenMembers={handleOpenMembers}
                onChangeStatus={handleChangeStatus}
              />
            </Col>
          ))}
        </Row>
      )}

      {selectedProject && (
        <ProjectMembersPanel
          project={selectedProject}
          members={members}
          allUsers={users}
          canManage={canEditProject(selectedProject)}
          isLoading={isMembersLoading}
          isAdding={isAddingMember}
          removingUserId={removingUserId}
          onAddMember={handleAddMember}
          onRemoveMember={handleRemoveMember}
          onClose={() => {
            setSelectedProject(null);
            setMembers([]);
          }}
        />
      )}
    </div>
  );
}

export default ProjectsPage;
