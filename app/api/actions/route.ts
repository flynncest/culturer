import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fireAction } from '@/lib/actions'

export async function POST(req: NextRequest) {
  const supabase = createClient()

  // Auth check
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let triggerId: string
  try {
    const body = await req.json()
    triggerId = body.triggerId
    if (!triggerId) {
      return NextResponse.json({ error: 'triggerId is required' }, { status: 400 })
    }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const result = await fireAction(triggerId)

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
