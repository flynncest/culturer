import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Kie.ai sends callbacks with either:
// Runway shape: { code, data: { task_id, videoInfo: { url } } }
// Veo3 shape:   { code, data: { task_id, video_url } }

export async function POST(req: NextRequest) {
  const supabase = createClient()

  let body: {
    code?: number
    data?: {
      task_id?: string
      videoInfo?: { url?: string }
      video_url?: string
    }
  }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const taskId = body?.data?.task_id
  if (!taskId) {
    return NextResponse.json({ error: 'Missing task_id' }, { status: 400 })
  }

  // Resolve video URL from either payload shape
  const videoUrl = body?.data?.videoInfo?.url ?? body?.data?.video_url ?? null

  // Find the video_job
  const { data: job, error: jobErr } = await supabase
    .from('video_jobs')
    .select('id, trigger_id')
    .eq('kie_task_id', taskId)
    .maybeSingle()

  if (jobErr || !job) {
    // Unknown task — acknowledge anyway to stop retries
    return NextResponse.json({ received: true, note: 'job not found' })
  }

  const isSuccess = body?.code === 200 && !!videoUrl

  if (isSuccess) {
    // Update video_job
    await supabase
      .from('video_jobs')
      .update({ status: 'completed', video_url: videoUrl })
      .eq('id', job.id)

    // Update trigger to sent
    await supabase
      .from('triggers')
      .update({ status: 'sent', fired_at: new Date().toISOString() })
      .eq('id', job.trigger_id)

    // Fetch trigger + person to send follow-up email with video
    const { data: trigger } = await supabase
      .from('triggers')
      .select('*, persons(*)')
      .eq('id', job.trigger_id)
      .single()

    if (trigger?.persons) {
      const person = trigger.persons as Record<string, unknown>
      const email = person.email as string
      const firstName = person.first_name as string

      const emailHtml = `
        <div style="font-family: DM Sans, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 24px; background: #f7f6f2; color: #f64d25;">
          <h1 style="font-family: 'Kaisei Decol', serif; font-size: 32px; margin-bottom: 16px;">Your personal video is ready, ${firstName}! 🎬</h1>
          <p style="font-size: 16px; line-height: 1.6; opacity: 0.8; margin-bottom: 24px;">
            We've created a personalised video just for you. Click below to watch it!
          </p>
          <p style="margin-bottom: 32px;">
            <a href="${videoUrl}" style="display: inline-block; padding: 14px 28px; background: #f64d25; color: #f7f6f2; text-decoration: none; border-radius: 4px; font-weight: 600; font-size: 15px;">
              Watch your video →
            </a>
          </p>
          <p style="font-size: 14px; opacity: 0.6;">With love,<br/>The Culturers Team</p>
        </div>
      `

      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Culturers <noreply@culturers.io>',
          to: email,
          subject: `Your personalised video is ready, ${firstName}!`,
          html: emailHtml,
        }),
      })
    }

    // Log video_ready action
    await supabase.from('actions_log').insert({
      trigger_id: job.trigger_id,
      action_type: 'video_ready',
      payload: { kie_task_id: taskId, video_url: videoUrl },
    })
  } else {
    // Failure
    await supabase
      .from('video_jobs')
      .update({ status: 'failed' })
      .eq('id', job.id)

    await supabase
      .from('triggers')
      .update({ status: 'failed', error_text: `Kie task failed (code=${body?.code})` })
      .eq('id', job.trigger_id)

    await supabase.from('actions_log').insert({
      trigger_id: job.trigger_id,
      action_type: 'video_requested',
      payload: { kie_task_id: taskId, error: `code=${body?.code}`, status: 'failed' },
    })
  }

  return NextResponse.json({ received: true })
}
