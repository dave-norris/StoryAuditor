# StoryAuditor Database SQL Reference

SQL statements for building tables in the Railway PostgreSQL database.

---

## Tables
```sql

# Users table
CREATE TABLE story_auditor.users (
  id  SERIAL PRIMARY KEY,
  auth_id VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(55) NOT NULL,
  email VARCHAR(255) NOT NULL,
  contactable BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_auth_id ON story_auditor.users(auth_id);
CREATE INDEX idx_users_email ON story_auditor.users(email);
CREATE INDEX idx_users_contactable ON story_auditor.users(contactable);

CREATE SCHEMA IF NOT EXISTS story_auditor;

-- ============================================
-- SERIES
-- ============================================
CREATE TABLE story_auditor.series (
  id BIGSERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES story_auditor.users(id),
  title TEXT NOT NULL,
  summary_md TEXT,
  summary_updated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_series_user_id ON story_auditor.series(user_id);

ALTER TABLE story_auditor.series ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_isolation ON story_auditor.series
  USING (user_id = current_setting('app.current_user_id', true)::INTEGER);

-- ============================================
-- BOOKS
-- ============================================
CREATE TABLE story_auditor.books (
  id BIGSERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES story_auditor.users(id),
  series_id BIGINT REFERENCES story_auditor.series(id) ON DELETE SET NULL,
  series_position INTEGER,
  title TEXT NOT NULL,
  summary_md TEXT,
  summary_updated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_books_user_id ON story_auditor.books(user_id);
CREATE INDEX idx_books_series_id ON story_auditor.books(series_id);

ALTER TABLE story_auditor.books ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_isolation ON story_auditor.books
  USING (user_id = current_setting('app.current_user_id', true)::INTEGER);

-- ============================================
-- CHAPTERS
-- ============================================
CREATE TABLE story_auditor.chapters (
  id BIGSERIAL PRIMARY KEY,
  book_id BIGINT NOT NULL REFERENCES story_auditor.books(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES story_auditor.users(id),
  chapter_number INTEGER NOT NULL,
  title TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (book_id, chapter_number)
);

CREATE INDEX idx_chapters_book_id ON story_auditor.chapters(book_id);

ALTER TABLE story_auditor.chapters ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_isolation ON story_auditor.chapters
  USING (user_id = current_setting('app.current_user_id', true)::INTEGER);

-- ============================================
-- SCENES
-- ============================================
CREATE TABLE story_auditor.scenes (
  id BIGSERIAL PRIMARY KEY,
  chapter_id BIGINT NOT NULL REFERENCES story_auditor.chapters(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES story_auditor.users(id),
  scene_number INTEGER NOT NULL,
  content_md TEXT NOT NULL,
  word_count INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (chapter_id, scene_number)
);

CREATE INDEX idx_scenes_chapter_id ON story_auditor.scenes(chapter_id);

ALTER TABLE story_auditor.scenes ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_isolation ON story_auditor.scenes
  USING (user_id = current_setting('app.current_user_id', true)::INTEGER);

-- ============================================
-- REPORT TYPES (lookup)
-- ============================================
CREATE TABLE story_auditor.report_types (
  code TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  scope TEXT NOT NULL DEFAULT 'book'
);

INSERT INTO story_auditor.report_types (code, category, label, description, scope) VALUES
('chekhovs_gun', 'Setup & Payoff', 'Chekhov''s Gun Audit', 'Identifies every significant element introduced early in the narrative and verifies whether it pays off later, flagging setups that never resolve.', 'book'),
('red_herring_vs_abandoned', 'Setup & Payoff', 'Red Herring vs. Abandoned Thread Audit', 'Distinguishes intentional misdirections from plot threads the author dropped unintentionally, ensuring every loose end is deliberate.', 'book'),
('foreshadowing_twist_fairness', 'Setup & Payoff', 'Foreshadowing Density & Twist Fairness Audit', 'Measures how evenly foreshadowing is distributed and whether twists are supported by prior clues so readers feel surprised but not cheated.', 'book'),
('macguffin_clarity', 'Setup & Payoff', 'MacGuffin Clarity Audit', 'Evaluates whether the object or goal driving the plot is clearly established and consistently motivates character actions throughout the story.', 'book'),
('want_vs_need', 'Character & Theme', 'Want vs. Need Audit', 'Examines whether each major character has a clear external want and internal need, and whether the tension between them drives meaningful growth.', 'book'),
('thematic_throughline', 'Character & Theme', 'Thematic Throughline Audit', 'Traces the central theme across scenes, subplots, and character arcs to ensure it is reinforced consistently without becoming heavy-handed.', 'book'),
('mirror_foil_character', 'Character & Theme', 'Mirror/Foil Character Audit', 'Identifies character pairings that reflect or contrast each other and assesses whether those relationships illuminate theme and deepen characterization.', 'book'),
('pov_discipline', 'Character & Theme', 'Point-of-View Discipline Audit', 'Checks for unintentional POV shifts, head-hopping, or information leaks that break the chosen narrative perspective.', 'book'),
('story_beat_placement', 'Structure & Pacing', 'Story Beat Placement Audit', 'Maps key structural beats against established story frameworks and highlights beats that arrive too early, too late, or are missing entirely.', 'book'),
('scene_sequel_balance', 'Structure & Pacing', 'Scene/Sequel (Action/Reaction) Balance Audit', 'Analyzes the ratio of high-action scenes to reflective sequel passages, ensuring readers get breathing room without momentum loss.', 'book'),
('show_vs_tell', 'Structure & Pacing', 'Show vs. Tell at Key Moments Audit', 'Pinpoints critical emotional or plot moments where the narrative tells rather than shows, suggesting where dramatization would strengthen impact.', 'book'),
('timeline_flashback', 'Structure & Pacing', 'Timeline Juxtaposition / Flashback Audit', 'Evaluates whether timeline shifts and flashbacks clarify the story or confuse readers, checking for clear transitions and narrative purpose.', 'book'),
('zeigarnik_open_loop', 'Reader Engagement & Psychology', 'Zeigarnik Effect / Open Loop Audit', 'Tracks open questions and unresolved tensions that keep readers turning pages, ensuring loops are opened intentionally and closed satisfyingly.', 'book'),
('dramatic_irony', 'Reader Engagement & Psychology', 'Dramatic Irony Audit', 'Identifies moments where the reader knows more than the characters and assesses whether that gap creates tension, humor, or dread as intended.', 'book'),
('stakes_escalation', 'Reader Engagement & Psychology', 'Stakes Escalation Audit', 'Charts how stakes rise across the narrative arc, flagging plateaus or reversals that may cause reader disengagement.', 'book'),
('cross_book_setup_payoff', 'Series-Level Craft Audits', 'Cross-Book Setup/Payoff Audit', 'Tracks setups planted in earlier books and verifies they pay off in subsequent installments, preventing series-spanning loose ends.', 'series'),
('series_pacing_comparator', 'Series-Level Craft Audits', 'Series Pacing Comparator', 'Compares pacing curves across multiple books in a series to identify installments that sag or rush relative to the overall series rhythm.', 'series'),
('recurring_motif_theme_series', 'Series-Level Craft Audits', 'Recurring Motif/Theme Tracker (Series)', 'Monitors recurring symbols, phrases, and thematic elements across the series to ensure cohesion and intentional evolution over time.', 'series');

-- ============================================
-- REPORTS
-- ============================================
CREATE TABLE story_auditor.reports (
  id BIGSERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES story_auditor.users(id),
  book_id BIGINT REFERENCES story_auditor.books(id) ON DELETE CASCADE,
  series_id BIGINT REFERENCES story_auditor.series(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL REFERENCES story_auditor.report_types(code),
  content_md TEXT,
  content_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT report_target_check CHECK (
    (book_id IS NOT NULL AND series_id IS NULL) OR
    (book_id IS NULL AND series_id IS NOT NULL)
  )
);

CREATE INDEX idx_reports_book_id ON story_auditor.reports(book_id);
CREATE INDEX idx_reports_series_id ON story_auditor.reports(series_id);
CREATE INDEX idx_reports_user_id ON story_auditor.reports(user_id);

ALTER TABLE story_auditor.reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_isolation ON story_auditor.reports
  USING (user_id = current_setting('app.current_user_id', true)::INTEGER);

-- ============================================
-- BIBLE ENTRY TYPES (lookup)
-- ============================================
CREATE TABLE story_auditor.bible_entry_types (
  code TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  template_md TEXT
);

INSERT INTO story_auditor.bible_entry_types (code, label, template_md) VALUES
('character', 'Character', $$
## Voice & Speech Patterns


## Physical Description


## Personality


## Background


## Motivations & Goals


## Relationships


## Arc Notes
$$),

('setting', 'Setting', $$
## Description


## Atmosphere & Sensory Details


## History


## Significance to Story


## Connected Characters/Events
$$),

('organization', 'Organization', $$
## Description


## Purpose & Function


## Structure & Hierarchy


## Key Members


## History


## Relevance to Plot
$$),

('item', 'Item', $$
## Description


## Origin


## Significance / Powers


## Current Location / Owner


## Appearances
$$),

('timeline', 'Timeline', $$
## Date / Period


## Event Description


## Characters Involved


## Consequences
$$);

-- ============================================
-- BIBLE ENTRIES
-- ============================================
CREATE TABLE story_auditor.bible_entries (
  id BIGSERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES story_auditor.users(id),
  book_id BIGINT REFERENCES story_auditor.books(id) ON DELETE CASCADE,
  series_id BIGINT REFERENCES story_auditor.series(id) ON DELETE CASCADE,
  entry_type TEXT NOT NULL REFERENCES story_auditor.bible_entry_types(code),
  name TEXT NOT NULL,
  content_md TEXT,
  content_json JSONB,
  priority INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT bible_target_check CHECK (
    (book_id IS NOT NULL AND series_id IS NULL) OR
    (book_id IS NULL AND series_id IS NOT NULL)
  )
);

CREATE INDEX idx_bible_entries_book_id ON story_auditor.bible_entries(book_id);
CREATE INDEX idx_bible_entries_series_id ON story_auditor.bible_entries(series_id);
CREATE INDEX idx_bible_entries_user_id ON story_auditor.bible_entries(user_id);
CREATE INDEX idx_bible_entries_type ON story_auditor.bible_entries(entry_type);

ALTER TABLE story_auditor.bible_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_isolation ON story_auditor.bible_entries
  USING (user_id = current_setting('app.current_user_id', true)::INTEGER);
```

---

## Notes

- Run these against the Railway PostgreSQL instance via the Railway console or a client like TablePlus/psql
- Connection string is available in Railway under the PostgreSQL service → **Variables** → `DATABASE_URL`
