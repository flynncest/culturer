import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = createClient()

  let body: {
    token: string
    favourite_treat?: string
    hobbies?: string
    gift_preference?: string
    tshirt_size?: string
    extra_notes?: string
  }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { token, favourite_treat, hobbies, gift_preference, tshirt_size, extra_notes } = body

  if (!token) {
    return NextResponse.json({ error: 'Token is required' }, { status: 400 })
  }

  // Find person by quiz_token
  const { data: person, error: personErr } = await supabase
    .from('persons')
    .select('id, quiz_completed_at')
    .eq('quiz_token', token)
    .maybeSingle()

  if (personErr || !person) {
    return NextResponse.json({ error: 'Invalid or expired quiz link' }, { status: 404 })
  }

  if (person.quiz_completed_at) {
    return NextResponse.json({ error: 'Quiz already completed' }, { status: 409 })
  }

  // Insert quiz response
  const { error: insertErr } = await supabase.from('quiz_responses').insert({
    person_id: person.id,
    favourite_treat: favourite_treat ?? null,
    hobbies: hobbies ?? null,
    gift_preference: gift_preference ?? null,
    tshirt_size: tshirt_size ?? null,
    extra_notes: extra_notes ?? null,
  })

  if (insertErr) {
    return NextResponse.json({ error: `Failed to save quiz: ${insertErr.message}` }, { status: 500 })
  }

  // Mark quiz completed
  await supabase
    .from('persons')
    .update({ quiz_completed_at: new Date().toISOString() })
    .eq('id', person.id)

  return NextResponse.json({ success: true })
}
