const express = require("express");

const { requireAuth } = require("../middleware/authMiddleware");
const {
  getProjectStatuses,
  getProjects,
  createProject,
  updateProject,
  changeProjectStatus,
  getProjectMembers,
  addProjectMember,
  removeProjectMember,
} = require("../controllers/projectController");

const router = express.Router();

//Statusy projektów
router.get("/api/project-statuses", requireAuth, getProjectStatuses);

// Główny moduł projektów.
router.get("/api/projects", requireAuth, getProjects);
router.post("/api/projects", requireAuth, createProject);
router.patch("/api/projects/:id", requireAuth, updateProject);
router.patch("/api/projects/:id/status", requireAuth, changeProjectStatus);
router.get("/api/projects/:id/members", requireAuth, getProjectMembers);
router.post("/api/projects/:id/members", requireAuth, addProjectMember);
router.delete("/api/projects/:id/members/:userId", requireAuth, removeProjectMember);

module.exports = router;
