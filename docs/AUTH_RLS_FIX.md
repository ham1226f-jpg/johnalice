# Authentication RLS Policy Fix

## Issue
After successful login, users are being redirected back to the login page because they cannot read their own user data from the `users` table due to missing or incorrect Row Level Security (RLS) policies.

## Solution

Run the following SQL in your Supabase SQL Editor to fix the RLS policies:

```sql
-- Enable RLS on users table if not already enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Admins can read all users in tenant" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Admins can manage users in tenant" ON users;

-- Policy: Users can read their own data
CREATE POLICY "Users can read own data"
ON users
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Policy: Admins can read all users in their tenant
CREATE POLICY "Admins can read all users in tenant"
ON users
FOR SELECT
TO authenticated
USING (
  tenant_id IN (
    SELECT tenant_id FROM users WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Policy: Users can update their own data (limited fields)
CREATE POLICY "Users can update own data"
ON users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policy: Admins can insert users in their tenant
CREATE POLICY "Admins can insert users in tenant"
ON users
FOR INSERT
TO authenticated
WITH CHECK (
  tenant_id IN (
    SELECT tenant_id FROM users WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Policy: Admins can update users in their tenant
CREATE POLICY "Admins can update users in tenant"
ON users
FOR UPDATE
TO authenticated
USING (
  tenant_id IN (
    SELECT tenant_id FROM users WHERE id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  tenant_id IN (
    SELECT tenant_id FROM users WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Policy: Admins can delete users in their tenant (except themselves)
CREATE POLICY "Admins can delete users in tenant"
ON users
FOR DELETE
TO authenticated
USING (
  id != auth.uid() AND
  tenant_id IN (
    SELECT tenant_id FROM users WHERE id = auth.uid() AND role = 'admin'
  )
);
```

## Verification

After running the SQL above:

1. Log out if currently logged in
2. Log in again with your credentials
3. You should now be redirected to the dashboard successfully
4. Check the browser console for any errors

## Additional Notes

- The policies ensure users can always read their own data
- Admins can read/manage all users within their tenant
- Users cannot delete themselves
- Sales persons can only see their own user data
