import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { mockSupabase } from '@/lib/mock-db'

const DEV_MODE = !process.env.NEXT_PUBLIC_SUPABASE_URL

export function createClient() {
  if (DEV_MODE) {
    // Return the in-memory mock when no Supabase credentials are configured
    return mockSupabase as any
  }

  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          try { cookieStore.set({ name, value, ...options }) } catch {}
        },
        remove(name: string, options: Record<string, unknown>) {
          try { cookieStore.set({ name, value: '', ...options }) } catch {}
        },
      },
    }
  )
}
