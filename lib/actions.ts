import { createClient } from '@/lib/supabase/server'
import {
  birthdayVideoPrompt,
  anniversaryVideoPrompt,
  renewalVideoPrompt,
  landingPagePrompt,
} from '@/lib/prompts'

export type ActionResult = { success: boolean; error?: string }

// ── Helpers ───────────────────────────────────────────────────────────────────

async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.log(`[DEV] Email not sent (no RESEND_API_KEY). Would send to: ${to} | Subject: ${subject}`)
    return
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Culturers <noreply@culturers.io>',
      to,
      subject,
      html,
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Resend error ${res.status}: ${err}`)
  }
}

async function callKieRunway(
  prompt: string,
  callbackUrl: string
): Promise<string> {
  if (!process.env.KIE_API_KEY) {
    const mockId = `dev-runway-${Date.now()}`
    console.log(`[DEV] Kie Runway not called (no KIE_API_KEY). Mock task_id: ${mockId}`)
    console.log(`[DEV] Prompt: ${prompt.slice(0, 100)}...`)
    return mockId
  }
  const res = await fetch('https://api.kie.ai/api/v1/runway/generate', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.KIE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt, callBackUrl: callbackUrl }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Kie Runway error ${res.status}: ${err}`)
  }
  const data = await res.json()
  return data?.data?.task_id as string
}

async function callKieVeo(
  prompt: string,
  callbackUrl: string
): Promise<string> {
  if (!process.env.KIE_API_KEY) {
    const mockId = `dev-veo-${Date.now()}`
    console.log(`[DEV] Kie Veo not called (no KIE_API_KEY). Mock task_id: ${mockId}`)
    return mockId
  }
  const res = await fetch('https://api.kie.ai/api/v1/veo/generate', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.KIE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt, callBackUrl: callbackUrl }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Kie Veo error ${res.status}: ${err}`)
  }
  const data = await res.json()
  return data?.data?.task_id as string
}

async function logAction(
  triggerId: string,
  actionType: string,
  payload: Record<string, unknown>
): Promise<void> {
  const supabase = createClient()
  await supabase.from('actions_log').insert({
    trigger_id: triggerId,
    action_type: actionType,
    payload,
  })
}

async function updateTriggerStatus(
  triggerId: string,
  status: string,
  error?: string
): Promise<void> {
  const supabase = createClient()
  await supabase
    .from('triggers')
    .update({
      status,
      fired_at: status === 'sent' || status === 'processing' ? new Date().toISOString() : undefined,
      error_text: error ?? null,
    })
    .eq('id', triggerId)
}

async function scheduleNextTrigger(
  person: { id: string; birth_date?: string | null; start_date?: string | null; package?: string | null },
  type: 'birthday' | 'anniversary'
): Promise<void> {
  const supabase = createClient()

  let nextDate: Date | null = null
  const today = new Date()
  const nextYear = today.getFullYear() + 1

  if (type === 'birthday' && person.birth_date) {
    const bd = new Date(person.birth_date)
    nextDate = new Date(nextYear, bd.getMonth(), bd.getDate())
  } else if (type === 'anniversary' && person.start_date) {
    const sd = new Date(person.start_date)
    nextDate = new Date(nextYear, sd.getMonth(), sd.getDate())
  }

  if (!nextDate) return

  await supabase.from('triggers').insert({
    person_id: person.id,
    type,
    trigger_date: nextDate.toISOString().split('T')[0],
    package: person.package,
    status: 'pending',
  })
}

// ── Flows ─────────────────────────────────────────────────────────────────────

async function birthdayFlow(
  trigger: Record<string, unknown>,
  person: Record<string, unknown>,
  quiz: Record<string, unknown> | null
): Promise<void> {
  const triggerId = trigger.id as string
  const firstName = person.first_name as string
  const email = person.email as string

  await updateTriggerStatus(triggerId, 'processing')

  // Send birthday email
  const emailHtml = `
    <div style="font-family: DM Sans, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 24px; background: #f7f6f2; color: #f64d25;">
      <h1 style="font-family: 'Kaisei Decol', serif; font-size: 32px; margin-bottom: 16px;">Happy Birthday, ${firstName}! 🎂</h1>
      <p style="font-size: 16px; line-height: 1.6; opacity: 0.8; margin-bottom: 24px;">
        Wishing you a fantastic birthday filled with everything you love.
        The whole team is thinking of you today!
      </p>
      <p style="font-size: 14px; opacity: 0.6;">With warmth,<br/>The Culturers Team</p>
    </div>
  `
  await sendEmail(email, `Happy Birthday, ${firstName}! 🎂`, emailHtml)
  await logAction(triggerId, 'email_sent', { to: email, subject: `Happy Birthday, ${firstName}!` })

  // Request birthday video via kie.ai
  const hobbies = (quiz?.hobbies as string) ?? 'various interests'
  const giftPref = (quiz?.gift_preference as string) ?? 'experience'
  const prompt = birthdayVideoPrompt(firstName, hobbies, giftPref)
  const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/kie`

  const taskId = await callKieRunway(prompt, callbackUrl)

  const supabase = createClient()
  await supabase.from('video_jobs').insert({
    trigger_id: triggerId,
    kie_task_id: taskId,
    status: 'pending',
  })
  await logAction(triggerId, 'video_requested', { kie_task_id: taskId, type: 'runway' })

  await updateTriggerStatus(triggerId, 'sent')
  await scheduleNextTrigger(person as Parameters<typeof scheduleNextTrigger>[0], 'birthday')
}

async function anniversaryFlow(
  trigger: Record<string, unknown>,
  person: Record<string, unknown>,
  quiz: Record<string, unknown> | null
): Promise<void> {
  const triggerId = trigger.id as string
  const firstName = person.first_name as string
  const email = person.email as string

  await updateTriggerStatus(triggerId, 'processing')

  // Calculate years
  let years = 1
  if (person.start_date) {
    const start = new Date(person.start_date as string)
    const now = new Date()
    years = Math.round((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365))
    if (years < 1) years = 1
  }

  const emailHtml = `
    <div style="font-family: DM Sans, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 24px; background: #f7f6f2; color: #f64d25;">
      <h1 style="font-family: 'Kaisei Decol', serif; font-size: 32px; margin-bottom: 16px;">Happy Work Anniversary, ${firstName}! 🎉</h1>
      <p style="font-size: 16px; line-height: 1.6; opacity: 0.8; margin-bottom: 24px;">
        Celebrating ${years} ${years === 1 ? 'year' : 'years'} of your incredible journey with us.
        Your contributions make all the difference.
      </p>
      <p style="font-size: 14px; opacity: 0.6;">With gratitude,<br/>The Culturers Team</p>
    </div>
  `
  await sendEmail(email, `Happy ${years}-Year Work Anniversary, ${firstName}!`, emailHtml)
  await logAction(triggerId, 'email_sent', { to: email, subject: `Happy Work Anniversary, ${firstName}!` })

  const hobbies = (quiz?.hobbies as string) ?? 'various interests'
  const prompt = anniversaryVideoPrompt(firstName, years, hobbies)
  const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/kie`

  const taskId = await callKieVeo(prompt, callbackUrl)

  const supabase = createClient()
  await supabase.from('video_jobs').insert({
    trigger_id: triggerId,
    kie_task_id: taskId,
    status: 'pending',
  })
  await logAction(triggerId, 'video_requested', { kie_task_id: taskId, type: 'veo' })

  await updateTriggerStatus(triggerId, 'sent')
  await scheduleNextTrigger(person as Parameters<typeof scheduleNextTrigger>[0], 'anniversary')
}

async function renewalFlow(
  trigger: Record<string, unknown>,
  person: Record<string, unknown>
): Promise<void> {
  const triggerId = trigger.id as string
  const email = person.email as string
  const companyName = (person.company_name as string) ?? (person.last_name as string)
  const firstName = person.first_name as string

  await updateTriggerStatus(triggerId, 'processing')

  const prompt = renewalVideoPrompt(companyName)
  const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/kie`
  const taskId = await callKieRunway(prompt, callbackUrl)

  const supabase = createClient()
  await supabase.from('video_jobs').insert({
    trigger_id: triggerId,
    kie_task_id: taskId,
    status: 'pending',
  })
  await logAction(triggerId, 'video_requested', { kie_task_id: taskId, type: 'runway', company: companyName })

  const emailHtml = `
    <div style="font-family: DM Sans, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 24px; background: #f7f6f2; color: #f64d25;">
      <h1 style="font-family: 'Kaisei Decol', serif; font-size: 32px; margin-bottom: 16px;">Your renewal is coming up, ${firstName}</h1>
      <p style="font-size: 16px; line-height: 1.6; opacity: 0.8; margin-bottom: 24px;">
        We wanted to reach out ahead of your upcoming renewal. We've loved working with ${companyName}
        and are excited about what's ahead. A personal video message is on its way!
      </p>
      <p style="font-size: 14px; opacity: 0.6;">The Culturers Team</p>
    </div>
  `
  await sendEmail(email, `Your Culturers renewal — ${companyName}`, emailHtml)
  await logAction(triggerId, 'email_sent', { to: email, subject: 'Renewal reminder' })
  await updateTriggerStatus(triggerId, 'sent')
}

async function onboardingFlow(
  trigger: Record<string, unknown>,
  person: Record<string, unknown>
): Promise<void> {
  const triggerId = trigger.id as string
  const firstName = person.first_name as string
  const email = person.email as string
  const quizToken = person.quiz_token as string

  await updateTriggerStatus(triggerId, 'processing')

  const quizUrl = `${process.env.NEXT_PUBLIC_APP_URL}/quiz/${quizToken}`
  const emailHtml = `
    <div style="font-family: DM Sans, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 24px; background: #f7f6f2; color: #f64d25;">
      <h1 style="font-family: 'Kaisei Decol', serif; font-size: 32px; margin-bottom: 16px;">Welcome, ${firstName}! 👋</h1>
      <p style="font-size: 16px; line-height: 1.6; opacity: 0.8; margin-bottom: 24px;">
        We're so excited to have you on board. To make sure we celebrate you in the most personal way possible,
        we'd love to learn a little more about you.
      </p>
      <p style="margin-bottom: 32px;">
        <a href="${quizUrl}" style="display: inline-block; padding: 14px 28px; background: #f64d25; color: #f7f6f2; text-decoration: none; border-radius: 4px; font-weight: 600; font-size: 15px;">
          Fill in your quick quiz →
        </a>
      </p>
      <p style="font-size: 14px; opacity: 0.6;">With excitement,<br/>The Culturers Team</p>
    </div>
  `
  await sendEmail(email, `Welcome to the team, ${firstName} — tell us about yourself!`, emailHtml)
  await logAction(triggerId, 'email_sent', { to: email, quiz_url: quizUrl })
  await updateTriggerStatus(triggerId, 'sent')
}

async function treatOutreachFlow(
  trigger: Record<string, unknown>,
  person: Record<string, unknown>,
  quiz: Record<string, unknown> | null
): Promise<void> {
  const triggerId = trigger.id as string
  const firstName = person.first_name as string
  const email = person.email as string

  await updateTriggerStatus(triggerId, 'processing')

  const treat = (quiz?.favourite_treat as string) ?? 'a special treat'
  const emailHtml = `
    <div style="font-family: DM Sans, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 24px; background: #f7f6f2; color: #f64d25;">
      <h1 style="font-family: 'Kaisei Decol', serif; font-size: 32px; margin-bottom: 16px;">A little something for you, ${firstName} 🎁</h1>
      <p style="font-size: 16px; line-height: 1.6; opacity: 0.8; margin-bottom: 24px;">
        We know you love ${treat}, so we wanted to reach out with something special just for you.
        Because great relationships deserve to be nurtured.
      </p>
      <p style="font-size: 14px; opacity: 0.6;">With care,<br/>The Culturers Team</p>
    </div>
  `
  await sendEmail(email, `A little something for you, ${firstName}`, emailHtml)
  await logAction(triggerId, 'email_sent', { to: email, treat })
  await logAction(triggerId, 'gift_queued', { recipient: email, treat })
  await updateTriggerStatus(triggerId, 'sent')
}

async function conversionLandingFlow(
  trigger: Record<string, unknown>,
  person: Record<string, unknown>,
  quiz: Record<string, unknown> | null
): Promise<void> {
  const triggerId = trigger.id as string
  const firstName = person.first_name as string
  const email = person.email as string
  const companyName = (person.company_name as string) ?? ''

  await updateTriggerStatus(triggerId, 'processing')

  // Generate personalised landing page via Anthropic (mock if no key)
  let htmlContent = ''
  const prompt = landingPagePrompt(firstName, companyName, quiz ?? {})

  if (!process.env.ANTHROPIC_API_KEY) {
    console.log(`[DEV] Anthropic not called (no ANTHROPIC_API_KEY). Using placeholder landing page.`)
    htmlContent = `<!DOCTYPE html><html><head><title>${firstName} — Culturers</title>
    <style>body{font-family:sans-serif;background:#f7f6f2;color:#f64d25;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;}
    .card{max-width:600px;padding:60px 40px;text-align:center;}h1{font-size:48px;margin-bottom:16px;}p{opacity:0.7;font-size:18px;line-height:1.6;}</style></head>
    <body><div class="card"><h1>Hi ${firstName} 👋</h1>
    <p>We built this page just for you at <strong>${companyName || 'your company'}</strong>.<br/>
    Culturers helps businesses make their people feel truly valued — through hyper-personalised gifting and recognition, on autopilot.</p>
    <p style="margin-top:32px;"><a href="https://culturers.io" style="background:#f64d25;color:#fff;padding:14px 28px;border-radius:4px;text-decoration:none;font-weight:600;">Book a call →</a></p>
    </div></body></html>`
  } else {
    const Anthropic = (await import('@anthropic-ai/sdk')).default
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    })
    htmlContent = message.content[0].type === 'text' ? message.content[0].text : ''
  }

  // Create slug
  const slug = `${firstName.toLowerCase()}-${companyName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`

  const supabase = createClient()
  await supabase.from('landing_pages').insert({
    person_id: person.id as string,
    slug,
    html_content: htmlContent,
  })

  const landingUrl = `${process.env.NEXT_PUBLIC_APP_URL}/p/${slug}`
  await logAction(triggerId, 'landing_page_created', { slug, url: landingUrl })

  // Send email with landing page link
  const emailHtml = `
    <div style="font-family: DM Sans, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 24px; background: #f7f6f2; color: #f64d25;">
      <h1 style="font-family: 'Kaisei Decol', serif; font-size: 32px; margin-bottom: 16px;">We made this just for you, ${firstName}</h1>
      <p style="font-size: 16px; line-height: 1.6; opacity: 0.8; margin-bottom: 24px;">
        We believe in showing rather than telling. Click below to see what Culturers could look like for ${companyName || 'your team'}.
      </p>
      <p style="margin-bottom: 32px;">
        <a href="${landingUrl}" style="display: inline-block; padding: 14px 28px; background: #f64d25; color: #f7f6f2; text-decoration: none; border-radius: 4px; font-weight: 600; font-size: 15px;">
          See your personalised page →
        </a>
      </p>
      <p style="font-size: 14px; opacity: 0.6;">The Culturers Team</p>
    </div>
  `
  await sendEmail(email, `We made something just for you, ${firstName}`, emailHtml)
  await logAction(triggerId, 'email_sent', { to: email, landing_url: landingUrl })
  await updateTriggerStatus(triggerId, 'sent')
}

// ── Main dispatcher ───────────────────────────────────────────────────────────

export async function fireAction(triggerId: string): Promise<ActionResult> {
  const supabase = createClient()

  try {
    // Fetch trigger
    const { data: trigger, error: triggerErr } = await supabase
      .from('triggers')
      .select('*')
      .eq('id', triggerId)
      .single()

    if (triggerErr || !trigger) {
      return { success: false, error: `Trigger not found: ${triggerErr?.message}` }
    }

    // Fetch person
    const { data: person, error: personErr } = await supabase
      .from('persons')
      .select('*')
      .eq('id', trigger.person_id)
      .single()

    if (personErr || !person) {
      return { success: false, error: `Person not found: ${personErr?.message}` }
    }

    // Fetch quiz response (optional)
    const { data: quizRows } = await supabase
      .from('quiz_responses')
      .select('*')
      .eq('person_id', person.id)
      .order('submitted_at', { ascending: false })
      .limit(1)
    const quiz = Array.isArray(quizRows) ? (quizRows[0] ?? null) : quizRows

    // Route to correct flow
    const type = trigger.type as string
    const pkg = (trigger.package ?? person.package ?? '') as string

    if (type === 'birthday') {
      await birthdayFlow(trigger, person, quiz)
    } else if (type === 'anniversary') {
      await anniversaryFlow(trigger, person, quiz)
    } else if (type === 'renewal') {
      await renewalFlow(trigger, person)
    } else if (type === 'onboarding') {
      await onboardingFlow(trigger, person)
    } else if (type === 'outreach' && pkg.includes('treat')) {
      await treatOutreachFlow(trigger, person, quiz)
    } else if (type === 'outreach' && pkg.includes('conversion')) {
      await conversionLandingFlow(trigger, person, quiz)
    } else {
      // Default outreach
      await treatOutreachFlow(trigger, person, quiz)
    }

    return { success: true }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    await updateTriggerStatus(triggerId, 'failed', errorMsg).catch(() => {})
    return { success: false, error: errorMsg }
  }
}
