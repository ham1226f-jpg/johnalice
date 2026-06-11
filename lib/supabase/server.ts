import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import type { Database } from '@/types/supabase'

export async function createClient() {
  const cookieStore = await cookies()
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const restPath = process.env.NEXT_PUBLIC_SUPABASE_REST_PATH || '/rest/mumbi/v1'

  return createServerClient<Database>(
    supabaseUrl,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
          }
        },
      },
      cookieOptions: {
        name: 'sb-mumbi-auth-token',
        domain: undefined,
        path: '/',
        sameSite: 'lax',
      },
      global: {
        fetch: (url, options) => {
          const rewritten = (url as string).replace(`${supabaseUrl}/rest/v1`, `${supabaseUrl}${restPath}`)
          return fetch(rewritten, options)
        }
      }
    }
  )
}

// Admin client for server-side operations that require elevated privileges
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const restPath = process.env.NEXT_PUBLIC_SUPABASE_REST_PATH || '/rest/mumbi/v1'

  return createSupabaseClient<Database>(
    supabaseUrl,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        fetch: (url, options) => {
          const rewritten = (url as string).replace(`${supabaseUrl}/rest/v1`, `${supabaseUrl}${restPath}`)
          return fetch(rewritten, options)
        }
      }
    }
  )
}
