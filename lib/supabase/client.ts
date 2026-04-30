import { createBrowserClient } from '@supabase/ssr'
import { mockSupabase } from '@/lib/mock-db'

export function createClient() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return mockSupabase as any
  }
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
