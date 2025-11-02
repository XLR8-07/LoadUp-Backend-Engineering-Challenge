-- Job Application Service Database Schema

-- Jobs table
CREATE TABLE IF NOT EXISTS jobs (
    id UUID PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    customer VARCHAR(255) NOT NULL,
    job_name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    questions JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT job_name_unique UNIQUE (job_name)
);

-- Create index on job_name for faster lookups
CREATE INDEX IF NOT EXISTS idx_jobs_job_name ON jobs(job_name);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at DESC);

-- Applications table
CREATE TABLE IF NOT EXISTS applications (
    id UUID PRIMARY KEY,
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    candidate_name VARCHAR(255) NOT NULL,
    candidate_email VARCHAR(255) NOT NULL,
    answers JSONB NOT NULL,
    score JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_applications_job_id ON applications(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_created_at ON applications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_applications_score ON applications((score->>'total') DESC);
CREATE INDEX IF NOT EXISTS idx_applications_candidate_email ON applications(candidate_email);

-- Add a comment to the database
COMMENT ON DATABASE job_application_service IS 'Job Application Service with auto-scoring';

-- Add comments to tables
COMMENT ON TABLE jobs IS 'Job postings with structured questions';
COMMENT ON TABLE applications IS 'Candidate applications with scores';

-- Add comments to columns
COMMENT ON COLUMN jobs.questions IS 'Array of question objects stored as JSONB for flexibility';
COMMENT ON COLUMN applications.answers IS 'Array of candidate answers stored as JSONB';
COMMENT ON COLUMN applications.score IS 'Score report with breakdown stored as JSONB';

