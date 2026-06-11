import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/supabase'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const restPath = process.env.NEXT_PUBLIC_SUPABASE_REST_PATH || '/rest/mumbi/v1'

  return createBrowserClient<Database>(
    supabaseUrl,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        // Extend session timeout to 7 days (default is 1 hour)
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        // Storage key for session persistence
        storageKey: 'mumbi-pos-auth',
      },
      global: {
        fetch: (url, options) => {
          const rewritten = (url as string).replace(`${supabaseUrl}/rest/v1`, `${supabaseUrl}${restPath}`)
          return fetch(rewritten, options)
        }
      },
      cookieOptions: {
        name: 'sb-mumbi-auth-token',
        domain: undefined,
        path: '/',
        sameSite: 'lax',
      }
    }
  )
}
