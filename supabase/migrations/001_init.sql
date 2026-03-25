-- ChatGPT Clone — Database Schema
-- Run this in your Supabase SQL Editor

-- 1. users (manual auth — bcrypt passwords, JWT sessions)
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 2. anonymous_sessions (unauthenticated users, max 3 questions)
CREATE TABLE anonymous_sessions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token  TEXT UNIQUE NOT NULL,
  question_count INT NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- 3. chats
--    Exactly one of user_id or anonymous_session_id must be set (mutex ownership)
CREATE TABLE chats (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID REFERENCES users(id) ON DELETE CASCADE,
  anonymous_session_id UUID REFERENCES anonymous_sessions(id) ON DELETE CASCADE,
  title                TEXT NOT NULL DEFAULT 'New Chat',
  model                TEXT NOT NULL DEFAULT 'gpt-4o',
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT chat_owner CHECK (
    (user_id IS NOT NULL AND anonymous_session_id IS NULL) OR
    (user_id IS NULL AND anonymous_session_id IS NOT NULL)
  )
);

CREATE INDEX idx_chats_user_id      ON chats(user_id);
CREATE INDEX idx_chats_anon_session ON chats(anonymous_session_id);
CREATE INDEX idx_chats_updated_at   ON chats(updated_at DESC);

-- 4. messages
CREATE TABLE messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id    UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  role       TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content    TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_chat_id ON messages(chat_id, created_at ASC);

-- 5. attachments
CREATE TABLE attachments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id   UUID REFERENCES messages(id) ON DELETE CASCADE,
  file_name    TEXT NOT NULL,
  file_type    TEXT NOT NULL CHECK (file_type IN ('image', 'document')),
  storage_path TEXT NOT NULL,
  mime_type    TEXT NOT NULL,
  file_size    INT NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_attachments_message_id ON attachments(message_id);

-- 6. Auto-update chats.updated_at when a message is inserted
CREATE OR REPLACE FUNCTION update_chat_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE chats SET updated_at = NOW() WHERE id = NEW.chat_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER messages_update_chat
AFTER INSERT ON messages
FOR EACH ROW EXECUTE FUNCTION update_chat_timestamp();

-- 7. Enable Realtime for the chats table (required for postgres_changes)
ALTER PUBLICATION supabase_realtime ADD TABLE chats;
