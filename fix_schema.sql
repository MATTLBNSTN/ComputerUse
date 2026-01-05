-- 1. Drop the check constraint or existing policies that might depend on it (if any, usually fine)
-- 2. Alter the column type
ALTER TABLE job_listings 
ALTER COLUMN user_id TYPE TEXT;

-- 3. If that fails due to dependencies, you might need to drop/recreate, but ALTER usually works for UUID -> TEXT.
