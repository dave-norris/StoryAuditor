-- Initial schema for StoryAuditor
-- This migration creates the basic User table

CREATE TABLE IF NOT EXISTS "User" (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255)
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_email ON "User"(email);
