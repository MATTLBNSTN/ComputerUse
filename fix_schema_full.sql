-- 1. Drop the policies that depend on the column
DROP POLICY "Users can view own jobs" ON job_listings;
DROP POLICY "Users can update own jobs" ON job_listings;

-- 2. Alter the column type to TEXT
ALTER TABLE job_listings 
ALTER COLUMN user_id TYPE TEXT;

-- 3. Recreate the policies (ensure we cast auth.uid() if needed, but usually Supabase wrapper handles it)
-- Note: auth.uid() returns uuid, so we cast it to text to match our new column type.
CREATE POLICY "Users can view own jobs"
ON job_listings
FOR SELECT
USING ( auth.uid()::text = user_id );

CREATE POLICY "Users can update own jobs"
ON job_listings
FOR UPDATE
USING ( auth.uid()::text = user_id );
