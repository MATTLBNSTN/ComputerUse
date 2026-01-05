-- Fix RLS policies to support Clerk User IDs (which are not UUIDs)
-- instead of using auth.uid(), we extract the 'sub' claim from the JWT directly.

-- 1. Drop existing policies that might use auth.uid()
DROP POLICY IF EXISTS "Users can view own jobs" ON job_listings;
DROP POLICY IF EXISTS "Users can update own jobs" ON job_listings;

-- 2. Ensure user_id is TEXT (it seems it is, but just in case)
-- ALTER TABLE job_listings ALTER COLUMN user_id TYPE TEXT;

-- 3. Recreate policies using auth.jwt() ->> 'sub'
CREATE POLICY "Users can view own jobs"
ON job_listings
FOR SELECT
USING ( (select auth.jwt() ->> 'sub') = user_id );

CREATE POLICY "Users can update own jobs"
ON job_listings
FOR UPDATE
USING ( (select auth.jwt() ->> 'sub') = user_id );

-- 4. Verify policy for insert if needed (usually users create their own jobs)
-- If there is an insert policy, it should also check the user_id.
-- Currently, service role might be handling inserts, or we might need an insert policy.
-- Adding a safe insert policy for users:
CREATE POLICY "Users can insert own jobs"
ON job_listings
FOR INSERT
WITH CHECK ( (select auth.jwt() ->> 'sub') = user_id );
