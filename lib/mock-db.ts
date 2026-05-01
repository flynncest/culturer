/**
 * In-memory database for development without Supabase credentials.
 * Stores data in module-level arrays — resets on server restart.
 * Mimics the Supabase query-builder return shape { data, error, count }.
 */

import { randomUUID } from 'crypto'

// ── Store ─────────────────────────────────────────────────────────────────────

type Row = Record<string, any>

const store: Record<string, Row[]> = {
  persons: [],
  quiz_responses: [],
  triggers: [],
  actions_log: [],
  video_jobs: [],
  landing_pages: [],
}

// Seed some demo data so the dashboard isn't empty on first load
function seedIfEmpty() {
  if (store.persons.length > 0) return

  const pid1 = randomUUID()
  const pid2 = randomUUID()
  const pid3 = randomUUID()

  store.persons = [
    {
      id: pid1,
      type: 'employee',
      first_name: 'Sarah',
      last_name: 'Chen',
      email: 'sarah@acme.com',
      company_name: 'Acme Corp',
      package: 'full_tracking',
      status: 'active',
      quiz_token: randomUUID(),
      quiz_completed_at: null,
      birth_date: '1990-05-15',
      start_date: '2022-03-01',
      renewal_date: null,
      created_at: new Date().toISOString(),
    },
    {
      id: pid2,
      type: 'client',
      first_name: 'James',
      last_name: 'Wilson',
      email: 'james@northtech.io',
      company_name: 'NorthTech',
      package: 'personalized_renewal',
      status: 'active',
      quiz_token: randomUUID(),
      quiz_completed_at: null,
      birth_date: null,
      start_date: null,
      renewal_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      created_at: new Date().toISOString(),
    },
    {
      id: pid3,
      type: 'prospect',
      first_name: 'Lena',
      last_name: 'Müller',
      email: 'lena@startup.de',
      company_name: 'Startup GmbH',
      package: 'conversion_landing',
      status: 'cold',
      quiz_token: randomUUID(),
      quiz_completed_at: null,
      birth_date: null,
      start_date: null,
      renewal_date: null,
      created_at: new Date().toISOString(),
    },
  ]

  const today = new Date().toISOString().split('T')[0]
  const tid1 = randomUUID()
  store.triggers = [
    {
      id: tid1,
      person_id: pid1,
      type: 'birthday',
      trigger_date: today,
      package: 'full_tracking',
      status: 'pending',
      fired_at: null,
      error_text: null,
      created_at: new Date().toISOString(),
    },
    {
      id: randomUUID(),
      person_id: pid2,
      type: 'renewal',
      trigger_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      package: 'personalized_renewal',
      status: 'pending',
      fired_at: null,
      error_text: null,
      created_at: new Date().toISOString(),
    },
  ]

  store.actions_log = [
    {
      id: randomUUID(),
      trigger_id: tid1,
      action_type: 'email_sent',
      payload: { note: 'Demo log entry — no real email sent in dev mode' },
      created_at: new Date().toISOString(),
    },
  ]
}

// ── Query builder ─────────────────────────────────────────────────────────────

class MockQuery {
  private tableName: string
  private filters: Array<(row: Row) => boolean> = []
  private orderField?: string
  private orderAsc = true
  private limitVal?: number
  private headOnly = false
  private countMode = false

  private insertRows?: Row[]
  private updateData?: Partial<Row>
  private upsertRows?: Row[]
  private upsertConflict?: string
  private isDelete = false
  private singleRow = false

  constructor(table: string) {
    this.tableName = table
    seedIfEmpty()
  }

  // Filtering
  eq(field: string, value: any) { this.filters.push(r => r[field] === value); return this }
  neq(field: string, value: any) { this.filters.push(r => r[field] !== value); return this }
  lte(field: string, value: any) { this.filters.push(r => r[field] <= value); return this }
  gte(field: string, value: any) { this.filters.push(r => r[field] >= value); return this }
  lt(field: string, value: any) { this.filters.push(r => r[field] < value); return this }
  gt(field: string, value: any) { this.filters.push(r => r[field] > value); return this }
  is(field: string, value: any) { this.filters.push(r => r[field] == value); return this }
  in(field: string, values: any[]) { this.filters.push(r => values.includes(r[field])); return this }

  // Projection / ordering / limiting (ignored in mock, just for API compat)
  select(_fields = '*', opts?: { count?: string; head?: boolean }) {
    if (opts?.count === 'exact') this.countMode = true
    if (opts?.head) this.headOnly = true
    return this
  }
  order(field: string, opts?: { ascending?: boolean }) {
    this.orderField = field
    this.orderAsc = opts?.ascending !== false
    return this
  }
  limit(n: number) { this.limitVal = n; return this }
  single() { this.singleRow = true; return this }

  // Mutations
  insert(data: Row | Row[]) {
    this.insertRows = Array.isArray(data) ? data : [data]
    return this
  }
  update(data: Partial<Row>) {
    this.updateData = data
    return this
  }
  upsert(data: Row | Row[], opts?: { onConflict?: string }) {
    this.upsertRows = Array.isArray(data) ? data : [data]
    this.upsertConflict = opts?.onConflict
    return this
  }
  delete() {
    this.isDelete = true
    return this
  }

  // Execute
  then(resolve: (v: any) => any, reject?: (e: any) => any) {
    try {
      const result = this._execute()
      return Promise.resolve(result).then(resolve, reject)
    } catch (e) {
      return Promise.reject(e).then(resolve, reject)
    }
  }

  private _execute(): { data: any; error: null; count?: number } {
    const tbl = store[this.tableName]
    if (!tbl) return { data: null, error: null }

    // INSERT
    if (this.insertRows) {
      const inserted = this.insertRows.map(row => ({
        id: randomUUID(),
        created_at: new Date().toISOString(),
        ...row,
      }))
      tbl.push(...inserted)
      return { data: inserted.length === 1 ? inserted[0] : inserted, error: null }
    }

    // UPSERT
    if (this.upsertRows) {
      const conflict = this.upsertConflict
      const result: Row[] = []
      for (const row of this.upsertRows) {
        let idx = -1
        if (conflict) {
          const keys = conflict.split(',').map(k => k.trim())
          idx = tbl.findIndex(existing =>
            keys.every(k => existing[k] === row[k])
          )
        }
        if (idx >= 0) {
          tbl[idx] = { ...tbl[idx], ...row }
          result.push(tbl[idx])
        } else {
          const newRow = { id: randomUUID(), created_at: new Date().toISOString(), ...row }
          tbl.push(newRow)
          result.push(newRow)
        }
      }
      return { data: result, error: null }
    }

    // UPDATE
    if (this.updateData) {
      let matched = tbl
      for (const f of this.filters) matched = matched.filter(f)
      for (const row of matched) {
        Object.assign(row, this.updateData)
      }
      return { data: matched, error: null }
    }

    // DELETE
    if (this.isDelete) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const before = tbl.length
      let keep = [...tbl]
      for (const f of this.filters) keep = keep.filter(r => !f(r) || false)
      // actually remove matching
      const toDelete = tbl.filter(r => this.filters.every(f => f(r)))
      for (const row of toDelete) {
        const i = store[this.tableName].indexOf(row)
        if (i >= 0) store[this.tableName].splice(i, 1)
      }
      return { data: null, error: null }
    }

    // SELECT
    let rows = [...tbl]
    for (const f of this.filters) rows = rows.filter(f)

    // Inline join simulation for select('*, triggers(*)') patterns
    rows = rows.map(row => this._resolveJoins(row))

    if (this.orderField) {
      const field = this.orderField
      const asc = this.orderAsc
      rows.sort((a, b) => {
        const va = a[field] ?? ''
        const vb = b[field] ?? ''
        return asc ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1)
      })
    }
    if (this.limitVal) rows = rows.slice(0, this.limitVal)
    if (this.countMode && this.headOnly) return { data: null, error: null, count: rows.length }
    if (this.countMode) return { data: rows, error: null, count: rows.length }
    if (this.singleRow) return { data: rows[0] ?? null, error: null }
    return { data: rows, error: null }
  }

  // Naive join: expand fk references for common select patterns
  private _resolveJoins(row: Row): Row {
    const result = { ...row }
    // persons → triggers
    if (this.tableName === 'persons') {
      result.triggers = store.triggers.filter(t => t.person_id === row.id)
    }
    // actions_log → triggers → persons
    if (this.tableName === 'actions_log') {
      const trigger = store.triggers.find(t => t.id === row.trigger_id)
      if (trigger) {
        const person = store.persons.find(p => p.id === trigger.person_id)
        result.triggers = { ...trigger, persons: person ?? null }
      }
    }
    return result
  }
}

// ── Mock Supabase client ──────────────────────────────────────────────────────

export const mockSupabase = {
  from(table: string) {
    return new MockQuery(table)
  },

  auth: {
    getSession: async () => ({
      data: {
        session: {
          user: { id: 'dev-user', email: 'dev@culturers.io' },
          access_token: 'dev-token',
        },
      },
      error: null,
    }),
    getUser: async () => ({
      data: { user: { id: 'dev-user', email: 'dev@culturers.io' } },
      error: null,
    }),
    signInWithPassword: async () => ({
      data: { session: { user: { id: 'dev-user' } } },
      error: null,
    }),
    signOut: async () => ({ error: null }),
  },

  storage: {
    from: (_bucket: string) => ({
      upload: async (_path: string, _data: any) => ({ data: { path: _path }, error: null }),
      getPublicUrl: (_path: string) => ({ data: { publicUrl: '' } }),
    }),
  },
}
