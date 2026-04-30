import { NextRequest, NextResponse } from 'next/server'
import { toZonedTime, format } from 'date-fns-tz'
import { createClient } from '@/lib/supabase/server'
import { fireAction } from '@/lib/actions'

export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get('authorization')
  const expectedSecret = `Bearer ${process.env.CRON_SECRET}`
  if (authHeader !== expectedSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient()

  // Get today's date in Amsterdam timezone
  const nowUtc = new Date()
  const amsterdamDate = toZonedTime(nowUtc, 'Europe/Amsterdam')
  const todayStr = format(amsterdamDate, 'yyyy-MM-dd', { timeZone: 'Europe/Amsterdam' })

  // Query pending triggers due today or earlier
  const { data: dueTriggers, error } = await supabase
    .from('triggers')
    .select('id, type, person_id, trigger_date')
    .eq('status', 'pending')
    .lte('trigger_date', todayStr)
    .order('trigger_date', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const triggers = dueTriggers ?? []
  let processed = 0
  let failed = 0
  const details: { triggerId: string; success: boolean; error?: string }[] = []

  for (const trigger of triggers) {
    try {
      const result = await fireAction(trigger.id)
      if (result.success) {
        processed++
      } else {
        failed++
      }
      details.push({ triggerId: trigger.id, success: result.success, error: result.error })
    } catch (err) {
      failed++
      details.push({
        triggerId: trigger.id,
        success: false,
        error: err instanceof Error ? err.message : String(err),
      })
    }

    // 500ms delay between trigger processings to avoid overwhelming external APIs
    await new Promise((resolve) => setTimeout(resolve, 500))
  }

  return NextResponse.json({
    processed,
    failed,
    total: triggers.length,
    date: todayStr,
    details,
  })
}
