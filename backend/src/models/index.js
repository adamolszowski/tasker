const sequelize = require("../db");

const Role = require("./Role")(sequelize);
const User = require("./User")(sequelize);
const ProjectStatus = require("./ProjectStatus")(sequelize);
const Project = require("./Project")(sequelize);
const ProjectMember = require("./ProjectMember")(sequelize);
const TaskStatus = require("./TaskStatus")(sequelize);
const TaskPriority = require("./TaskPriority")(sequelize);
const Task = require("./Task")(sequelize);
const TaskComment = require("./TaskComment")(sequelize);
const ProjectMessage = require("./ProjectMessage")(sequelize);
const Notification = require("./Notification")(sequelize);

Role.hasMany(User, {
  foreignKey: "role_id",
  as: "users",
});

User.belongsTo(Role, {
  foreignKey: "role_id",
  as: "role",
});

User.belongsTo(User, {
  foreignKey: "approved_by_user_id",
  as: "approvedBy",
});

User.hasMany(User, {
  foreignKey: "approved_by_user_id",
  as: "approvedUsers",
});

ProjectStatus.hasMany(Project, {
  foreignKey: "status_id",
  as: "projects",
});

Project.belongsTo(ProjectStatus, {
  foreignKey: "status_id",
  as: "status",
});

User.hasMany(Project, {
  foreignKey: "created_by_user_id",
  as: "createdProjects",
});

Project.belongsTo(User, {
  foreignKey: "created_by_user_id",
  as: "owner",
});

Project.hasMany(ProjectMember, {
  foreignKey: "project_id",
  as: "memberRows",
});

ProjectMember.belongsTo(Project, {
  foreignKey: "project_id",
  as: "project",
});

User.hasMany(ProjectMember, {
  foreignKey: "user_id",
  as: "projectMemberships",
});

ProjectMember.belongsTo(User, {
  foreignKey: "user_id",
  as: "user",
});

User.hasMany(ProjectMember, {
  foreignKey: "added_by_user_id",
  as: "addedProjectMembers",
});

ProjectMember.belongsTo(User, {
  foreignKey: "added_by_user_id",
  as: "addedBy",
});

Project.belongsToMany(User, {
  through: ProjectMember,
  foreignKey: "project_id",
  otherKey: "user_id",
  as: "members",
});

User.belongsToMany(Project, {
  through: ProjectMember,
  foreignKey: "user_id",
  otherKey: "project_id",
  as: "memberProjects",
});

TaskStatus.hasMany(Task, {
  foreignKey: "status_id",
  as: "tasks",
});

Task.belongsTo(TaskStatus, {
  foreignKey: "status_id",
  as: "status",
});

TaskPriority.hasMany(Task, {
  foreignKey: "priority_id",
  as: "tasks",
});

Task.belongsTo(TaskPriority, {
  foreignKey: "priority_id",
  as: "priority",
});

Project.hasMany(Task, {
  foreignKey: "project_id",
  as: "tasks",
});

Task.belongsTo(Project, {
  foreignKey: "project_id",
  as: "project",
});

User.hasMany(Task, {
  foreignKey: "assigned_user_id",
  as: "assignedTasks",
});

Task.belongsTo(User, {
  foreignKey: "assigned_user_id",
  as: "assignedUser",
});

User.hasMany(Task, {
  foreignKey: "created_by_user_id",
  as: "createdTasks",
});

Task.belongsTo(User, {
  foreignKey: "created_by_user_id",
  as: "createdBy",
});

Task.hasMany(TaskComment, {
  foreignKey: "task_id",
  as: "comments",
});

TaskComment.belongsTo(Task, {
  foreignKey: "task_id",
  as: "task",
});

User.hasMany(TaskComment, {
  foreignKey: "user_id",
  as: "comments",
});

TaskComment.belongsTo(User, {
  foreignKey: "user_id",
  as: "author",
});

Project.hasMany(ProjectMessage, {
  foreignKey: "project_id",
  as: "messages",
});

ProjectMessage.belongsTo(Project, {
  foreignKey: "project_id",
  as: "project",
});

User.hasMany(ProjectMessage, {
  foreignKey: "user_id",
  as: "projectMessages",
});

ProjectMessage.belongsTo(User, {
  foreignKey: "user_id",
  as: "author",
});

User.hasMany(Notification, {
  foreignKey: "user_id",
  as: "notifications",
});

Notification.belongsTo(User, {
  foreignKey: "user_id",
  as: "user",
});

Task.hasMany(Notification, {
  foreignKey: "task_id",
  as: "notifications",
});

Notification.belongsTo(Task, {
  foreignKey: "task_id",
  as: "task",
});

Project.hasMany(Notification, {
  foreignKey: "project_id",
  as: "notifications",
});

Notification.belongsTo(Project, {
  foreignKey: "project_id",
  as: "project",
});

module.exports = {
  sequelize,
  Role,
  User,
  ProjectStatus,
  Project,
  ProjectMember,
  TaskStatus,
  TaskPriority,
  Task,
  TaskComment,
  ProjectMessage,
  Notification,
};