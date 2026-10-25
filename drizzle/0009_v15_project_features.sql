-- V1.5 Project Features Migration
-- Adds: project_type enum/column, project_reactions, project_comments, project_followers, project_updates

-- 1. Create project_type enum
CREATE TYPE project_type_enum AS ENUM ('personal', 'team', 'open_source', 'research', 'coursework');

-- 2. Add project_type column to projects table (additive, default 'personal')
ALTER TABLE projects ADD COLUMN type project_type_enum NOT NULL DEFAULT 'personal';

-- 3. Create project_reaction_type enum
CREATE TYPE project_reaction_type_enum AS ENUM ('like', 'celebrate', 'insight', 'curious');

-- 4. Create project_reactions table (F19)
CREATE TABLE project_reactions (
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type project_reaction_type_enum NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (project_id, profile_id, type)
);

CREATE INDEX project_reactions_project_idx ON project_reactions (project_id);
CREATE INDEX project_reactions_profile_idx ON project_reactions (profile_id);

-- 5. Create project_comments table (F19)
CREATE TABLE project_comments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES project_comments(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 1000),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX project_comments_project_idx ON project_comments (project_id, created_at DESC, id DESC);
CREATE INDEX project_comments_parent_idx ON project_comments (parent_id);

-- 6. Create project_followers table (F19)
CREATE TABLE project_followers (
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (project_id, profile_id)
);

CREATE INDEX project_followers_profile_idx ON project_followers (profile_id);

-- 7. Create project_updates table (F20)
CREATE TABLE project_updates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 5000),
  image_key text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX project_updates_project_idx ON project_updates (project_id, created_at DESC, id DESC);
CREATE INDEX project_updates_author_idx ON project_updates (author_id);

-- 8. Partial indexes for project types (F18 catalogue performance)
CREATE INDEX projects_published_personal_idx ON projects (published_at DESC, id DESC) WHERE status = 'published' AND type = 'personal';
CREATE INDEX projects_published_team_idx ON projects (published_at DESC, id DESC) WHERE status = 'published' AND type = 'team';
CREATE INDEX projects_published_open_source_idx ON projects (published_at DESC, id DESC) WHERE status = 'published' AND type = 'open_source';
CREATE INDEX projects_published_research_idx ON projects (published_at DESC, id DESC) WHERE status = 'published' AND type = 'research';
CREATE INDEX projects_published_coursework_idx ON projects (published_at DESC, id DESC) WHERE status = 'published' AND type = 'coursework';