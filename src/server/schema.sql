PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS practitioners (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  npi_enc TEXT,
  tax_id_enc TEXT,
  timezone TEXT NOT NULL DEFAULT 'America/New_York',
  reminder_offsets_json TEXT NOT NULL DEFAULT '[1440,60]',
  baa_accepted_at TEXT,
  baa_version TEXT,
  stripe_account_id TEXT,
  subscription_status TEXT NOT NULL DEFAULT 'none'
    CHECK (subscription_status IN ('none','trialing','active','past_due','canceled','cancel_requested')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  practitioner_id TEXT NOT NULL REFERENCES practitioners(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_practitioner ON sessions(practitioner_id);

CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  practitioner_id TEXT NOT NULL REFERENCES practitioners(id) ON DELETE CASCADE,
  display_name_enc TEXT NOT NULL,
  email_enc TEXT,
  phone_enc TEXT,
  dob_enc TEXT,
  diagnosis_enc TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_clients_practitioner ON clients(practitioner_id, created_at);

CREATE TABLE IF NOT EXISTS appointments (
  id TEXT PRIMARY KEY,
  practitioner_id TEXT NOT NULL REFERENCES practitioners(id) ON DELETE CASCADE,
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  starts_at TEXT NOT NULL,
  ends_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled','attended','cancelled','no_show')),
  service_code TEXT NOT NULL,
  service_description TEXT NOT NULL,
  place_of_service TEXT NOT NULL DEFAULT '11',
  fee_cents INTEGER NOT NULL CHECK (fee_cents >= 0),
  video INTEGER NOT NULL DEFAULT 0 CHECK (video IN (0, 1)),
  telehealth_token TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK (ends_at > starts_at)
);
CREATE INDEX IF NOT EXISTS idx_appts_practitioner_start ON appointments(practitioner_id, starts_at);
CREATE INDEX IF NOT EXISTS idx_appts_client ON appointments(client_id, starts_at);

CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY,
  practitioner_id TEXT NOT NULL REFERENCES practitioners(id) ON DELETE CASCADE,
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  appointment_id TEXT REFERENCES appointments(id) ON DELETE SET NULL,
  template TEXT NOT NULL CHECK (template IN ('soap','dap','free')),
  body_enc TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','signed')),
  author_id TEXT,
  signed_at TEXT,
  content_hash TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_notes_client ON notes(client_id, created_at);

CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  practitioner_id TEXT NOT NULL REFERENCES practitioners(id) ON DELETE CASCADE,
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  appointment_id TEXT REFERENCES appointments(id) ON DELETE SET NULL,
  method TEXT NOT NULL CHECK (method IN ('stripe','cash','transfer')),
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  currency TEXT NOT NULL DEFAULT 'usd',
  paid_at TEXT NOT NULL,
  stripe_event_id TEXT UNIQUE,
  stripe_payment_intent_id TEXT UNIQUE,
  platform_fee_cents INTEGER NOT NULL DEFAULT 0 CHECK (platform_fee_cents = 0),
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_payments_client ON payments(client_id, paid_at);
CREATE INDEX IF NOT EXISTS idx_payments_appt ON payments(appointment_id);

CREATE TABLE IF NOT EXISTS reminder_jobs (
  id TEXT PRIMARY KEY,
  practitioner_id TEXT NOT NULL REFERENCES practitioners(id) ON DELETE CASCADE,
  appointment_id TEXT NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  offset_minutes INTEGER NOT NULL,
  send_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','sent','cancelled')),
  created_at TEXT NOT NULL,
  UNIQUE (appointment_id, offset_minutes)
);
CREATE INDEX IF NOT EXISTS idx_reminders_send ON reminder_jobs(status, send_at);

CREATE TABLE IF NOT EXISTS portal_links (
  id TEXT PRIMARY KEY,
  practitioner_id TEXT NOT NULL REFERENCES practitioners(id) ON DELETE CASCADE,
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_portal_client ON portal_links(client_id);

CREATE TABLE IF NOT EXISTS intake_submissions (
  id TEXT PRIMARY KEY,
  practitioner_id TEXT NOT NULL REFERENCES practitioners(id) ON DELETE CASCADE,
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  answers_enc TEXT NOT NULL,
  consent_name TEXT NOT NULL,
  consent_signed_at TEXT NOT NULL,
  consent_hash TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_intake_client ON intake_submissions(client_id, created_at);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  practitioner_id TEXT NOT NULL REFERENCES practitioners(id) ON DELETE CASCADE,
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  sender TEXT NOT NULL CHECK (sender IN ('practitioner','client')),
  body_enc TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_messages_client ON messages(client_id, created_at);

CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY,
  actor_id TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_log(entity_type, entity_id, at);
CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_log(actor_id, at);

CREATE TABLE IF NOT EXISTS outbox (
  id TEXT PRIMARY KEY,
  practitioner_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  reminder_job_id TEXT UNIQUE,
  payload_enc TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS stripe_events (
  id TEXT PRIMARY KEY,
  received_at TEXT NOT NULL
);

CREATE TRIGGER IF NOT EXISTS notes_lock_signed
BEFORE UPDATE ON notes
FOR EACH ROW
WHEN OLD.status = 'signed'
BEGIN
  SELECT RAISE(ABORT, 'signed notes are immutable');
END;

CREATE TRIGGER IF NOT EXISTS audit_no_update
BEFORE UPDATE ON audit_log
BEGIN
  SELECT RAISE(ABORT, 'audit rows cannot be modified');
END;

CREATE TRIGGER IF NOT EXISTS audit_no_delete
BEFORE DELETE ON audit_log
BEGIN
  SELECT RAISE(ABORT, 'audit rows cannot be deleted');
END;
