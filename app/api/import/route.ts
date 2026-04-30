import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/** Compute the next occurrence of a MM-DD date from a given starting date */
function computeNextOccurrence(mmdd: string, from: Date): Date {
  const [mm, dd] = mmdd.split('-').map(Number)
  const year = from.getFullYear()

  // Try this year first
  let candidate = new Date(year, mm - 1, dd)
  if (candidate <= from) {
    // Already passed this year — use next year
    candidate = new Date(year + 1, mm - 1, dd)
  }
  return candidate
}

/** Simple CSV parser: returns array of objects keyed by header row */
function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split(/\r?\n/)
  if (lines.length < 2) return []

  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/\s+/g, '_'))

  return lines.slice(1).map((line) => {
    // Handle quoted fields
    const values: string[] = []
    let current = ''
    let inQuote = false
    for (const ch of line) {
      if (ch === '"') {
        inQuote = !inQuote
      } else if (ch === ',' && !inQuote) {
        values.push(current.trim())
        current = ''
      } else {
        current += ch
      }
    }
    values.push(current.trim())

    return headers.reduce<Record<string, string>>((acc, h, i) => {
      acc[h] = values[i] ?? ''
      return acc
    }, {})
  })
}

export async function POST(req: NextRequest) {
  const supabase = createClient()

  // Auth check
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let csvText: string
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }
    csvText = await file.text()
  } catch {
    return NextResponse.json({ error: 'Failed to read file' }, { status: 400 })
  }

  const rows = parseCSV(csvText)
  if (rows.length === 0) {
    return NextResponse.json({ error: 'CSV is empty or malformed' }, { status: 400 })
  }

  let imported = 0
  let skipped = 0
  const errors: string[] = []
  const today = new Date()

  for (const row of rows) {
    try {
      const email = row.email?.toLowerCase()
      if (!email) {
        skipped++
        continue
      }

      const personData = {
        type: (row.type ?? 'employee') as 'employee' | 'client' | 'prospect',
        first_name: row.first_name ?? row.firstname ?? '',
        last_name: row.last_name ?? row.lastname ?? '',
        email,
        company_name: row.company_name ?? row.company ?? null,
        package: row.package ?? null,
        birth_date: row.birth_date ?? row.birthday ?? null,
        start_date: row.start_date ?? row.startdate ?? null,
        renewal_date: row.renewal_date ?? row.renewaldate ?? null,
        status: row.status ?? 'active',
      }

      if (!personData.first_name || !personData.last_name) {
        errors.push(`Row with email ${email}: missing first_name or last_name`)
        skipped++
        continue
      }

      // Upsert person by email
      const { data: person, error: personErr } = await supabase
        .from('persons')
        .upsert(personData, { onConflict: 'email' })
        .select()
        .single()

      if (personErr || !person) {
        errors.push(`${email}: ${personErr?.message ?? 'insert failed'}`)
        skipped++
        continue
      }

      // Compute and insert triggers (only if no pending/processing trigger of that type exists)
      const triggersToInsert: {
        person_id: string
        type: string
        trigger_date: string
        package: string | null
        status: 'pending'
      }[] = []

      // Birthday trigger
      if (person.birth_date) {
        const mmdd = (person.birth_date as string).slice(5) // YYYY-MM-DD → MM-DD
        const nextBirthday = computeNextOccurrence(mmdd, today)
        triggersToInsert.push({
          person_id: person.id,
          type: 'birthday',
          trigger_date: nextBirthday.toISOString().split('T')[0],
          package: person.package,
          status: 'pending',
        })
      }

      // Anniversary trigger (for employees)
      if (person.start_date && person.type === 'employee') {
        const mmdd = (person.start_date as string).slice(5)
        const nextAnniversary = computeNextOccurrence(mmdd, today)
        triggersToInsert.push({
          person_id: person.id,
          type: 'anniversary',
          trigger_date: nextAnniversary.toISOString().split('T')[0],
          package: person.package,
          status: 'pending',
        })
      }

      // Renewal trigger (for clients)
      if (person.renewal_date && person.type === 'client') {
        triggersToInsert.push({
          person_id: person.id,
          type: 'renewal',
          trigger_date: person.renewal_date as string,
          package: person.package,
          status: 'pending',
        })
      }

      // Onboarding trigger for new employees (fire immediately if start_date is today or future within 7 days)
      if (person.type === 'employee' && person.start_date) {
        const startDate = new Date(person.start_date as string)
        const diffDays = Math.ceil((startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        if (diffDays >= 0 && diffDays <= 7) {
          triggersToInsert.push({
            person_id: person.id,
            type: 'onboarding',
            trigger_date: (person.start_date as string).split('T')[0],
            package: person.package,
            status: 'pending',
          })
        }
      }

      if (triggersToInsert.length > 0) {
        await supabase.from('triggers').insert(triggersToInsert)
      }

      imported++
    } catch (err) {
      errors.push(`Row error: ${err instanceof Error ? err.message : String(err)}`)
      skipped++
    }
  }

  return NextResponse.json({ imported, skipped, errors })
}
