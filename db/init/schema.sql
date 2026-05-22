DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS project_messages CASCADE;
DROP TABLE IF EXISTS task_comments CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS project_members CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS task_priorities CASCADE;
DROP TABLE IF EXISTS task_statuses CASCADE;
DROP TABLE IF EXISTS project_statuses CASCADE;
DROP TABLE IF EXISTS roles CASCADE;

DROP FUNCTION IF EXISTS set_updated_at() CASCADE;


CREATE TABLE roles (
    id              BIGSERIAL PRIMARY KEY,
    name            VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE users (
    id                  BIGSERIAL PRIMARY KEY,
    login               VARCHAR(50) NOT NULL UNIQUE,
    password_hash       VARCHAR(255) NOT NULL,
    first_name          VARCHAR(100),
    last_name           VARCHAR(100),
    email               VARCHAR(255) UNIQUE,
    phone               VARCHAR(30),
    role_id             BIGINT NULL,
    approved_by_user_id BIGINT NULL,
    approved_at         TIMESTAMP NULL,
    created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    must_change_password BOOLEAN NOT NULL DEFAULT FALSE,

    CONSTRAINT fk_users_role
        FOREIGN KEY (role_id)
        REFERENCES roles(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL
);

ALTER TABLE users
ADD CONSTRAINT fk_users_approved_by
    FOREIGN KEY (approved_by_user_id)
    REFERENCES users(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL;

CREATE TABLE project_statuses (
    id              BIGSERIAL PRIMARY KEY,
    name            VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE projects (
    id                  BIGSERIAL PRIMARY KEY,
    name                VARCHAR(150) NOT NULL,
    description         TEXT,
    status_id           BIGINT NOT NULL,
    created_by_user_id  BIGINT NOT NULL,
    created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_projects_status
        FOREIGN KEY (status_id)
        REFERENCES project_statuses(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_projects_created_by
        FOREIGN KEY (created_by_user_id)
        REFERENCES users(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

CREATE TABLE project_members (
    id                  BIGSERIAL PRIMARY KEY,
    project_id          BIGINT NOT NULL,
    user_id             BIGINT NOT NULL,
    added_by_user_id    BIGINT NOT NULL,
    joined_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_project_members_project
        FOREIGN KEY (project_id)
        REFERENCES projects(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_project_members_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_project_members_added_by
        FOREIGN KEY (added_by_user_id)
        REFERENCES users(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT uq_project_members_project_user
        UNIQUE (project_id, user_id)
);

CREATE TABLE task_statuses (
    id              BIGSERIAL PRIMARY KEY,
    name            VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE task_priorities (
    id              BIGSERIAL PRIMARY KEY,
    name            VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE tasks (
    id                  BIGSERIAL PRIMARY KEY,
    project_id          BIGINT NOT NULL,
    title               VARCHAR(200) NOT NULL,
    description         TEXT,
    status_id           BIGINT NOT NULL,
    priority_id         BIGINT NOT NULL,
    assigned_user_id    BIGINT NULL,
    created_by_user_id  BIGINT NOT NULL,
    deadline            TIMESTAMP NULL,
    created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_tasks_project
        FOREIGN KEY (project_id)
        REFERENCES projects(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_tasks_status
        FOREIGN KEY (status_id)
        REFERENCES task_statuses(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_tasks_priority
        FOREIGN KEY (priority_id)
        REFERENCES task_priorities(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_tasks_assigned_user
        FOREIGN KEY (assigned_user_id)
        REFERENCES users(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    CONSTRAINT fk_tasks_created_by
        FOREIGN KEY (created_by_user_id)
        REFERENCES users(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

CREATE TABLE task_comments (
    id              BIGSERIAL PRIMARY KEY,
    task_id         BIGINT NOT NULL,
    user_id         BIGINT NOT NULL,
    content         TEXT NOT NULL,
    is_edited       BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_task_comments_task
        FOREIGN KEY (task_id)
        REFERENCES tasks(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_task_comments_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

CREATE TABLE project_messages (
    id              BIGSERIAL PRIMARY KEY,
    project_id      BIGINT NOT NULL,
    user_id         BIGINT NOT NULL,
    content         TEXT NOT NULL,
    is_edited       BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_project_messages_project
        FOREIGN KEY (project_id)
        REFERENCES projects(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_project_messages_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

CREATE TABLE notifications (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL,
    task_id         BIGINT NULL,
    project_id      BIGINT NULL,
    type            VARCHAR(100) NOT NULL,
    content         TEXT NOT NULL,
    is_read         BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_notifications_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_notifications_task
        FOREIGN KEY (task_id)
        REFERENCES tasks(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_notifications_project
        FOREIGN KEY (project_id)
        REFERENCES projects(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_projects_updated_at
BEFORE UPDATE ON projects
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_tasks_updated_at
BEFORE UPDATE ON tasks
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_task_comments_updated_at
BEFORE UPDATE ON task_comments
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_project_messages_updated_at
BEFORE UPDATE ON project_messages
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_users_role_id ON users(role_id);
CREATE INDEX idx_users_approved_by_user_id ON users(approved_by_user_id);

CREATE INDEX idx_projects_status_id ON projects(status_id);
CREATE INDEX idx_projects_created_by_user_id ON projects(created_by_user_id);

CREATE INDEX idx_project_members_project_id ON project_members(project_id);
CREATE INDEX idx_project_members_user_id ON project_members(user_id);
CREATE INDEX idx_project_members_added_by_user_id ON project_members(added_by_user_id);

CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_status_id ON tasks(status_id);
CREATE INDEX idx_tasks_priority_id ON tasks(priority_id);
CREATE INDEX idx_tasks_assigned_user_id ON tasks(assigned_user_id);
CREATE INDEX idx_tasks_created_by_user_id ON tasks(created_by_user_id);
CREATE INDEX idx_tasks_deadline ON tasks(deadline);

CREATE INDEX idx_task_comments_task_id ON task_comments(task_id);
CREATE INDEX idx_task_comments_user_id ON task_comments(user_id);

CREATE INDEX idx_project_messages_project_id ON project_messages(project_id);
CREATE INDEX idx_project_messages_user_id ON project_messages(user_id);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_task_id ON notifications(task_id);
CREATE INDEX idx_notifications_project_id ON notifications(project_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_type ON notifications(type);

INSERT INTO roles (name) VALUES
('superadmin'),
('administrator'),
('kierownik'),
('pracownik');

INSERT INTO project_statuses (name) VALUES
('w_toku'),
('wykonany'),
('usuniety');

INSERT INTO task_statuses (name) VALUES
('do_zrobienia'),
('w_trakcie'),
('zrobione');

INSERT INTO task_priorities (name) VALUES
('niski'),
('sredni'),
('wysoki');

INSERT INTO users (
  login,
  password_hash,
  first_name,
  last_name,
  email,
  phone,
  role_id,
  approved_at,
  must_change_password
)
VALUES (
  'superadmin',
  '$2a$10$6tWruSJd.Kob7BPpYjF71eFmN87E6c5zEoCBKfxUD2YPUpilnp6ee',
  'Super',
  'Admin',
  NULL,
  NULL,
  (SELECT id FROM roles WHERE name = 'superadmin'),
  CURRENT_TIMESTAMP,
  TRUE
);

INSERT INTO users (
  login,
  password_hash,
  first_name,
  last_name,
  email,
  phone,
  role_id,
  approved_by_user_id,
  approved_at,
  must_change_password
)
VALUES
(
  'admin1',
  crypt('Admin123!', gen_salt('bf', 10)),
  'Adam',
  'Administrator',
  'admin1@tasker.local',
  '600100101',
  (SELECT id FROM roles WHERE name = 'administrator'),
  (SELECT id FROM users WHERE login = 'superadmin'),
  CURRENT_TIMESTAMP,
  FALSE
),
(
  'admin2',
  crypt('Admin123!', gen_salt('bf', 10)),
  'Alicja',
  'Administrator',
  'admin2@tasker.local',
  '600100102',
  (SELECT id FROM roles WHERE name = 'administrator'),
  (SELECT id FROM users WHERE login = 'superadmin'),
  CURRENT_TIMESTAMP,
  FALSE
),
(
  'kier1',
  crypt('Kier123!', gen_salt('bf', 10)),
  'Kamil',
  'Kierownik',
  'kier1@tasker.local',
  '600200101',
  (SELECT id FROM roles WHERE name = 'kierownik'),
  (SELECT id FROM users WHERE login = 'superadmin'),
  CURRENT_TIMESTAMP,
  FALSE
),
(
  'kier2',
  crypt('Kier123!', gen_salt('bf', 10)),
  'Karolina',
  'Kierownik',
  'kier2@tasker.local',
  '600200102',
  (SELECT id FROM roles WHERE name = 'kierownik'),
  (SELECT id FROM users WHERE login = 'superadmin'),
  CURRENT_TIMESTAMP,
  FALSE
),
(
  'prac1',
  crypt('Prac123!', gen_salt('bf', 10)),
  'Piotr',
  'Pracownik',
  'prac1@tasker.local',
  '600300101',
  (SELECT id FROM roles WHERE name = 'pracownik'),
  (SELECT id FROM users WHERE login = 'superadmin'),
  CURRENT_TIMESTAMP,
  FALSE
),
(
  'prac2',
  crypt('Prac123!', gen_salt('bf', 10)),
  'Paulina',
  'Pracownik',
  'prac2@tasker.local',
  '600300102',
  (SELECT id FROM roles WHERE name = 'pracownik'),
  (SELECT id FROM users WHERE login = 'superadmin'),
  CURRENT_TIMESTAMP,
  FALSE
);