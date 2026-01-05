-- 1. Reset Table (Optional - Be careful!)
DROP TABLE IF EXISTS job_listings;

-- 2. Create Table
CREATE TABLE job_listings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    
    -- Core Job Data
    company_name TEXT NOT NULL,
    role_title TEXT NOT NULL,
    job_description TEXT,
    job_link TEXT NOT NULL UNIQUE, -- Prevent duplicates
    hiring_manager TEXT,
    
    -- User & Status
    user_id TEXT NOT NULL, -- This should match your Clerk User ID
    is_actioned BOOLEAN DEFAULT false,
    
    -- Generated Assets
    resume_url TEXT,
    cover_letter_url TEXT,
    drive_folder_url TEXT
);

-- 3. Enable Security (RLS)
ALTER TABLE job_listings ENABLE ROW LEVEL SECURITY;

-- 4. Policies

-- Policy: Backend (Service Role) has full access
-- (Service role bypasses RLS by default in Supabase, but explicit is good documentation)
CREATE POLICY "Service Role Full Access"
ON job_listings
FOR ALL
USING ( auth.role() = 'service_role' );

-- Policy: Users can only see their own jobs
CREATE POLICY "Users can view own jobs"
ON job_listings
FOR SELECT
USING ( auth.uid()::text = user_id );

-- Policy: Users can update their own jobs (e.g. marking as actioned)
CREATE POLICY "Users can update own jobs"
ON job_listings
FOR UPDATE
USING ( auth.uid()::text = user_id );
