ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS title VARCHAR(150) NOT NULL DEFAULT 'Powiadomienie',
ADD COLUMN IF NOT EXISTS read_at TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS actor_name VARCHAR(150) NULL,
ADD COLUMN IF NOT EXISTS source_text TEXT NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_is_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

CREATE EXTENSION IF NOT EXISTS pg_cron;

CREATE OR REPLACE FUNCTION create_task_assignment_notification()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.assigned_user_id IS NULL THEN
        RETURN NEW;
    END IF;

    IF TG_OP = 'INSERT' THEN
        INSERT INTO notifications (
            user_id,
            task_id,
            project_id,
            type,
            title,
            content
        )
        VALUES (
            NEW.assigned_user_id,
            NEW.id,
            NEW.project_id,
            'task_assigned',
            'Przypisano Ci zadanie',
            'Przypisano Ci zadanie "' || NEW.title || '".'
        );
    ELSIF OLD.assigned_user_id IS DISTINCT FROM NEW.assigned_user_id THEN
        INSERT INTO notifications (
            user_id,
            task_id,
            project_id,
            type,
            title,
            content
        )
        VALUES (
            NEW.assigned_user_id,
            NEW.id,
            NEW.project_id,
            'task_assigned',
            'Przypisano Ci zadanie',
            'Przypisano Ci zadanie "' || NEW.title || '".'
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION create_task_status_notification()
RETURNS TRIGGER AS $$
DECLARE
    old_status_name TEXT;
    new_status_name TEXT;
BEGIN
    IF NEW.assigned_user_id IS NULL THEN
        RETURN NEW;
    END IF;

    IF OLD.status_id IS DISTINCT FROM NEW.status_id THEN
        SELECT name INTO old_status_name
        FROM task_statuses
        WHERE id = OLD.status_id;

        SELECT name INTO new_status_name
        FROM task_statuses
        WHERE id = NEW.status_id;

        INSERT INTO notifications (
            user_id,
            task_id,
            project_id,
            type,
            title,
            content
        )
        VALUES (
            NEW.assigned_user_id,
            NEW.id,
            NEW.project_id,
            'task_status_changed',
            'Zmiana statusu zadania',
            'Status zadania "' || NEW.title || '" zmienił się z "' ||
            COALESCE(old_status_name, 'brak') || '" na "' ||
            COALESCE(new_status_name, 'brak') || '".'
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION create_task_comment_notifications()
RETURNS TRIGGER AS $$
DECLARE
    comment_author_name TEXT;
BEGIN
    SELECT
        COALESCE(NULLIF(TRIM(COALESCE(u.first_name, '') || ' ' || COALESCE(u.last_name, '')), ''), u.login)
    INTO comment_author_name
    FROM users u
    WHERE u.id = NEW.user_id;

    INSERT INTO notifications (
        user_id,
        task_id,
        project_id,
        type,
        title,
        content,
        actor_name,
        source_text
    )
    SELECT DISTINCT
        recipient.user_id,
        t.id,
        t.project_id,
        'task_comment_added',
        'Nowy komentarz do zadania',
        'Dodano komentarz do zadania "' || t.title || '".',
        comment_author_name,
        NEW.content
    FROM tasks t
    CROSS JOIN LATERAL (
        SELECT t.assigned_user_id AS user_id
        WHERE t.assigned_user_id IS NOT NULL
          AND t.assigned_user_id <> NEW.user_id

        UNION

        SELECT t.created_by_user_id AS user_id
        WHERE t.created_by_user_id <> NEW.user_id

        UNION

        SELECT p.created_by_user_id AS user_id
        FROM projects p
        WHERE p.id = t.project_id
          AND p.created_by_user_id <> NEW.user_id
    ) AS recipient
    WHERE t.id = NEW.task_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION create_project_message_notifications()
RETURNS TRIGGER AS $$
DECLARE
    message_author_name TEXT;
BEGIN
    SELECT
        COALESCE(NULLIF(TRIM(COALESCE(u.first_name, '') || ' ' || COALESCE(u.last_name, '')), ''), u.login)
    INTO message_author_name
    FROM users u
    WHERE u.id = NEW.user_id;

    INSERT INTO notifications (
        user_id,
        project_id,
        type,
        title,
        content,
        actor_name,
        source_text
    )
    SELECT DISTINCT
        recipient.user_id,
        p.id,
        'project_message_added',
        'Nowa wiadomość w projekcie',
        'W projekcie "' || p.name || '" pojawiła się nowa wiadomość.',
        message_author_name,
        NEW.content
    FROM projects p
    CROSS JOIN LATERAL (
        SELECT pm.user_id
        FROM project_members pm
        WHERE pm.project_id = NEW.project_id
          AND pm.user_id <> NEW.user_id

        UNION

        SELECT p.created_by_user_id
        WHERE p.created_by_user_id <> NEW.user_id
    ) AS recipient
    WHERE p.id = NEW.project_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION create_due_soon_task_notifications()
RETURNS void AS $$
BEGIN
    INSERT INTO notifications (
        user_id,
        task_id,
        project_id,
        type,
        title,
        content
    )
    SELECT
        t.assigned_user_id,
        t.id,
        t.project_id,
        'task_due_soon',
        'Zbliża się termin zadania',
        'Zadanie "' || t.title || '" ma termin realizacji jutro.'
    FROM tasks t
    JOIN task_statuses ts ON ts.id = t.status_id
    WHERE t.assigned_user_id IS NOT NULL
      AND t.deadline IS NOT NULL
      AND t.deadline::date = CURRENT_DATE + 1
      AND LOWER(ts.name) <> 'zrobione'
      AND NOT EXISTS (
          SELECT 1
          FROM notifications n
          WHERE n.user_id = t.assigned_user_id
            AND n.task_id = t.id
            AND n.type = 'task_due_soon'
            AND n.created_at::date = CURRENT_DATE
      );
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_task_assignment_notification ON tasks;
CREATE TRIGGER trg_task_assignment_notification
AFTER INSERT OR UPDATE OF assigned_user_id ON tasks
FOR EACH ROW
EXECUTE FUNCTION create_task_assignment_notification();

DROP TRIGGER IF EXISTS trg_task_status_notification ON tasks;
CREATE TRIGGER trg_task_status_notification
AFTER UPDATE OF status_id ON tasks
FOR EACH ROW
EXECUTE FUNCTION create_task_status_notification();

DROP TRIGGER IF EXISTS trg_task_comment_notification ON task_comments;
CREATE TRIGGER trg_task_comment_notification
AFTER INSERT ON task_comments
FOR EACH ROW
EXECUTE FUNCTION create_task_comment_notifications();

DROP TRIGGER IF EXISTS trg_project_message_notification ON project_messages;
CREATE TRIGGER trg_project_message_notification
AFTER INSERT ON project_messages
FOR EACH ROW
EXECUTE FUNCTION create_project_message_notifications();

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM cron.job
        WHERE jobname = 'task-due-soon-notifications'
    ) THEN
        PERFORM cron.unschedule('task-due-soon-notifications');
    END IF;
END $$;

SELECT cron.schedule(
    'task-due-soon-notifications',
    '0 8 * * *',
    $$SELECT create_due_soon_task_notifications();$$
);
