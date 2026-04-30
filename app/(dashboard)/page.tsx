import { createClient } from '@/lib/supabase/server'
import DashboardClient from '@/components/DashboardClient'

export const revalidate = 0

export default async function DashboardPage() {
  const supabase = createClient()

  // Fetch all persons
  const { data: persons } = await supabase
    .from('persons')
    .select('*, triggers(*)')
    .order('created_at', { ascending: false })

  // Fetch actions log with person names
  const { data: actionsLog } = await supabase
    .from('actions_log')
    .select('*, triggers(*, persons(first_name, last_name, email))')
    .order('created_at', { ascending: false })
    .limit(100)

  // Stats
  const today = new Date().toISOString().split('T')[0]

  const { count: pendingToday } = await supabase
    .from('triggers')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending')
    .lte('trigger_date', today)

  const { count: inProgressVideos } = await supabase
    .from('video_jobs')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending')

  const { count: failedActions } = await supabase
    .from('triggers')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'failed')

  return (
    <DashboardClient
      persons={persons ?? []}
      actionsLog={actionsLog ?? []}
      stats={{
        pendingToday: pendingToday ?? 0,
        inProgressVideos: inProgressVideos ?? 0,
        failedActions: failedActions ?? 0,
        totalPersons: persons?.length ?? 0,
      }}
    />
  )
}
