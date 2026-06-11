# User Creation Fix

## Problem
The "user not allowed" error occurred because the application was trying to use Supabase admin methods (`auth.admin.createUser()`) from the client-side code, which requires elevated privileges.

## Solution
Created server-side API routes that use the Supabase service role key for admin operations.

## Changes Made

1. **Created API Routes** (server-side):
   - `app/api/users/route.ts` - Create new users
   - `app/api/users/[userId]/route.ts` - Delete users
   - `app/api/users/[userId]/password/route.ts` - Change user passwords

2. **Updated Server Client** (`lib/supabase/server.ts`):
   - Added `createAdminClient()` function that uses the service role key
   - This client has elevated privileges for admin operations

3. **Updated User Service** (`lib/services/users.ts`):
   - Changed `createUser()` to call `/api/users` endpoint
   - Changed `deleteUser()` to call `/api/users/[userId]` endpoint
   - Changed `changeUserPassword()` to call `/api/users/[userId]/password` endpoint

## Required Environment Variable

Add this to your `.env.local` file:

```bash
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### How to Get Your Service Role Key:

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **API**
3. Under **Project API keys**, copy the **service_role** key (NOT the anon key)
4. Add it to your `.env.local` file

⚠️ **Important**: The service role key bypasses Row Level Security (RLS) and should NEVER be exposed to the client. Keep it in `.env.local` and never commit it to version control.

## After Adding the Key

1. Restart your development server
2. Try creating a new sales user again
3. The error should be resolved

## Security Notes

- Only admin users can create, delete, or change passwords for other users
- The API routes verify the current user's role before allowing operations
- The service role key is only used server-side and never exposed to the browser
