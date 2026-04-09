-- 013: Create notifications table

CREATE TABLE IF NOT EXISTS notifications (
    id           UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID          NOT NULL REFERENCES users(id),
    title        VARCHAR(200)  NOT NULL,
    message      TEXT          NOT NULL,
    type         VARCHAR(50)   NOT NULL,
    is_read      BOOLEAN       DEFAULT FALSE,
    reference_id UUID,
    created_at   TIMESTAMPTZ   DEFAULT NOW()
);

-- Index for notification bell query
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications (user_id, is_read, created_at DESC);
