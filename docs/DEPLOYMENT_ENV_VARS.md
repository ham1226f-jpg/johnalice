# Missing Environment Variable - SUPABASE_SERVICE_ROLE_KEY

## Issue Found
The `/api/users` endpoint is returning 500 errors because the `SUPABASE_SERVICE_ROLE_KEY` environment variable is not set in the production environment.

## Evidence
- Login works ✅
- Dashboard loads ✅  
- Users page shows "No users found" ❌
- Network logs show: `GET /api/users?page=1&pageSize=20 => [500]`

## Root Cause
The API route `app/api/users/route.ts` uses `createAdminClient()` which requires the service role key:

```typescript
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,  // <-- This is missing
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
```

## Solution

### Step 1: Get Your Service Role Key
1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/kqjcnpxyrltdovhhlaug
2. Click on "Settings" in the left sidebar
3. Click on "API"
4. Under "Project API keys", find the "service_role" key (secret)
5. Copy this key

### Step 2: Add to Dokploy Environment Variables
1. Go to your Dokploy dashboard
2. Navigate to your application settings
3. Go to "Environment Variables" section
4. Add a new environment variable:
   - **Name**: `SUPABASE_SERVICE_ROLE_KEY`
   - **Value**: [paste the service role key you copied]
5. Save the changes
6. Redeploy the application

### Step 3: Verify
After redeployment:
1. Navigate to https://rubenpos.munene.shop/users
2. Users should now be displayed
3. Check browser console - no more 500 errors

## Security Note
⚠️ **IMPORTANT**: The service role key bypasses Row Level Security (RLS) policies. 
- Never expose this key in client-side code
- Only use it in server-side API routes
- Keep it secret and secure

## Alternative Solution (If Service Role Key Cannot Be Added)
If you cannot add the service role key, you would need to modify the API routes to work without admin privileges, but this would require significant changes to handle RLS policies differently.
