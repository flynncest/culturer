'use client'

import { useState, useRef } from 'react'

type Trigger = {
  id: string
  type: string
  trigger_date: string
  status: string
  package: string | null
  fired_at: string | null
}

type Person = {
  id: string
  type: string
  first_name: string
  last_name: string
  email: string
  company_name: string | null
  package: string | null
  status: string
  quiz_token: string
  quiz_completed_at: string | null
  birth_date: string | null
  start_date: string | null
  renewal_date: string | null
  created_at: string
  triggers?: Trigger[]
}

type ActionLog = {
  id: string
  trigger_id: string | null
  action_type: string
  payload: Record<string, unknown> | null
  created_at: string
  triggers?: {
    type: string
    persons?: {
      first_name: string
      last_name: string
      email: string
    }
  } | null
}

type Stats = {
  pendingToday: number
  inProgressVideos: number
  failedActions: number
  totalPersons: number
}

type Props = {
  persons: Person[]
  actionsLog: ActionLog[]
  stats: Stats
}

const ACCENT = '#f64d25'
const BG = '#f7f6f2'
const BORDER = 'rgba(246,77,37,0.14)'

function Badge({
  children,
  color,
}: {
  children: React.ReactNode
  color: 'green' | 'orange' | 'grey' | 'amber' | 'blue' | 'red'
}) {
  const styles: Record<string, React.CSSProperties> = {
    green: { background: 'rgba(34,197,94,0.12)', color: '#16a34a' },
    orange: { background: 'rgba(246,77,37,0.12)', color: ACCENT },
    grey: { background: 'rgba(0,0,0,0.06)', color: 'rgba(246,77,37,0.6)' },
    amber: { background: 'rgba(201,95,0,0.1)', color: '#c95f00' },
    blue: { background: 'rgba(59,130,246,0.1)', color: '#2563eb' },
    red: { background: 'rgba(220,38,38,0.1)', color: '#dc2626' },
  }
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: 500,
        ...styles[color],
      }}
    >
      {children}
    </span>
  )
}

function StatCard({ num, label, onClick }: { num: number; label: string; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        border: `1px solid ${BORDER}`,
        padding: '18px 20px',
        borderRadius: '4px',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'border-color 0.15s, box-shadow 0.15s',
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          ;(e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(246,77,37,0.3)'
          ;(e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 8px rgba(246,77,37,0.07)'
        }
      }}
      onMouseLeave={(e) => {
        ;(e.currentTarget as HTMLDivElement).style.borderColor = BORDER
        ;(e.currentTarget as HTMLDivElement).style.boxShadow = 'none'
      }}
    >
      <div
        style={{
          fontFamily: "'Kaisei Decol', serif",
          fontSize: '38px',
          lineHeight: 1,
          letterSpacing: '-0.02em',
          marginBottom: '5px',
        }}
      >
        {num}
      </div>
      <div style={{ fontSize: '13px', opacity: 0.55, letterSpacing: '0.04em' }}>{label}</div>
    </div>
  )
}

function ActionButton({
  label,
  onClick,
  variant = 'outline',
}: {
  label: string
  onClick: () => void
  variant?: 'primary' | 'outline' | 'ghost'
}) {
  const [loading, setLoading] = useState(false)

  const styles: Record<string, React.CSSProperties> = {
    primary: { background: ACCENT, color: BG, border: 'none' },
    outline: {
      background: 'transparent',
      color: ACCENT,
      border: `1.5px solid rgba(246,77,37,0.3)`,
    },
    ghost: { background: 'transparent', color: ACCENT, border: 'none', opacity: 0.5 },
  }

  const handleClick = async () => {
    setLoading(true)
    try {
      await onClick()
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 12px',
        borderRadius: '3px',
        fontFamily: "'DM Sans', sans-serif",
        fontSize: '12px',
        fontWeight: 500,
        letterSpacing: '0.04em',
        cursor: loading ? 'not-allowed' : 'pointer',
        opacity: loading ? 0.5 : 1,
        transition: 'opacity 0.15s',
        ...styles[variant],
      }}
    >
      {loading ? '...' : label}
    </button>
  )
}

export default function DashboardClient({ persons, actionsLog, stats }: Props) {
  const [activeTab, setActiveTab] = useState<'employees' | 'clients' | 'prospects' | 'log'>(
    'employees'
  )
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [localPersons] = useState<Person[]>(persons)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [csvLoading, setCsvLoading] = useState(false)

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  const refreshPersons = async () => {
    // Simple page refresh to get fresh data
    window.location.reload()
  }

  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setCsvLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/import', { method: 'POST', body: formData })
      const data = await res.json()

      if (!res.ok) {
        showToast(`Import failed: ${data.error}`, 'error')
      } else {
        showToast(
          `Imported ${data.imported} records. Skipped: ${data.skipped}. ${data.errors?.length ? `Errors: ${data.errors.length}` : ''}`,
          'success'
        )
        await refreshPersons()
      }
    } catch {
      showToast('Upload failed — please try again', 'error')
    } finally {
      setCsvLoading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const fireTrigger = async (triggerId: string) => {
    const res = await fetch('/api/actions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ triggerId }),
    })
    const data = await res.json()
    if (!res.ok) {
      showToast(`Action failed: ${data.error}`, 'error')
    } else {
      showToast('Action fired successfully!', 'success')
      await refreshPersons()
    }
  }

  const copyQuizLink = (token: string) => {
    const url = `${window.location.origin}/quiz/${token}`
    navigator.clipboard.writeText(url)
    showToast('Quiz link copied to clipboard!')
  }

  const employees = localPersons.filter((p) => p.type === 'employee')
  const clients = localPersons.filter((p) => p.type === 'client')
  const prospects = localPersons.filter((p) => p.type === 'prospect')

  const getNextTrigger = (person: Person): Trigger | null => {
    if (!person.triggers?.length) return null
    const pending = person.triggers
      .filter((t) => t.status === 'pending')
      .sort((a, b) => a.trigger_date.localeCompare(b.trigger_date))
    return pending[0] ?? null
  }

  const tabs = [
    { id: 'employees', label: `Employees (${employees.length})` },
    { id: 'clients', label: `Clients (${clients.length})` },
    { id: 'prospects', label: `Prospects (${prospects.length})` },
    { id: 'log', label: 'Log' },
  ] as const

  const tableStyle: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
  }
  const thStyle: React.CSSProperties = {
    textAlign: 'left',
    fontSize: '11px',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    opacity: 0.48,
    padding: '0 14px 10px',
    borderBottom: `1px solid ${BORDER}`,
    whiteSpace: 'nowrap',
  }
  const tdStyle: React.CSSProperties = {
    padding: '11px 14px',
    fontSize: '14px',
    borderBottom: `1px solid ${BORDER}`,
    verticalAlign: 'middle',
  }

  const actionTypeColor = (type: string): React.CSSProperties => {
    if (type === 'email_sent') return { color: '#2563eb' }
    if (type === 'video_requested') return { color: '#c95f00' }
    if (type === 'video_ready') return { color: '#16a34a' }
    if (type === 'gift_queued') return { color: '#7c3aed' }
    if (type === 'landing_page_created') return { color: ACCENT }
    return { color: 'rgba(246,77,37,0.6)' }
  }

  return (
    <div style={{ padding: '32px', fontFamily: "'DM Sans', sans-serif", color: ACCENT }}>
      {/* Toast */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            padding: '12px 20px',
            borderRadius: '4px',
            background: toast.type === 'success' ? '#16a34a' : '#dc2626',
            color: '#fff',
            fontSize: '13px',
            fontWeight: 500,
            zIndex: 9999,
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            maxWidth: '400px',
          }}
        >
          {toast.msg}
        </div>
      )}

      {/* Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '14px',
          marginBottom: '24px',
        }}
      >
        <StatCard num={stats.totalPersons} label="Total People" />
        <StatCard num={stats.pendingToday} label="Due Today" onClick={() => setActiveTab('log')} />
        <StatCard num={stats.inProgressVideos} label="Videos In Progress" />
        <StatCard num={stats.failedActions} label="Failed Actions" onClick={() => setActiveTab('log')} />
      </div>

      {/* CSV Upload */}
      <div
        style={{
          border: `2px dashed rgba(246,77,37,0.25)`,
          borderRadius: '4px',
          padding: '24px 32px',
          textAlign: 'center',
          marginBottom: '24px',
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          e.currentTarget.style.borderColor = ACCENT
          e.currentTarget.style.background = 'rgba(246,77,37,0.04)'
        }}
        onDragLeave={(e) => {
          e.currentTarget.style.borderColor = 'rgba(246,77,37,0.25)'
          e.currentTarget.style.background = 'transparent'
        }}
        onDrop={(e) => {
          e.preventDefault()
          const file = e.dataTransfer.files?.[0]
          if (file && fileInputRef.current) {
            const dt = new DataTransfer()
            dt.items.add(file)
            fileInputRef.current.files = dt.files
            handleCsvUpload({ target: fileInputRef.current } as React.ChangeEvent<HTMLInputElement>)
          }
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          style={{ display: 'none' }}
          onChange={handleCsvUpload}
        />
        <div style={{ fontSize: '22px', marginBottom: '8px', opacity: 0.45 }}>📤</div>
        <div style={{ fontSize: '14px', opacity: 0.6, lineHeight: 1.5 }}>
          {csvLoading ? (
            'Importing...'
          ) : (
            <>
              <strong style={{ color: ACCENT, opacity: 1 }}>Click to upload</strong> or drag & drop a
              CSV file
              <br />
              <span style={{ fontSize: '12px' }}>
                Columns: type, first_name, last_name, email, company_name, package, birth_date,
                start_date, renewal_date
              </span>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '2px',
          background: 'rgba(246,77,37,0.06)',
          borderRadius: '5px',
          padding: '3px',
          marginBottom: '20px',
          width: 'fit-content',
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '6px 14px',
              borderRadius: '3px',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer',
              border: 'none',
              background: activeTab === tab.id ? BG : 'transparent',
              color: ACCENT,
              opacity: activeTab === tab.id ? 1 : 0.5,
              fontFamily: "'DM Sans', sans-serif",
              transition: 'all 0.15s',
              boxShadow: activeTab === tab.id ? '0 1px 3px rgba(246,77,37,0.12)' : 'none',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Employees Tab */}
      {activeTab === 'employees' && (
        <div style={{ border: `1px solid ${BORDER}`, borderRadius: '4px', overflow: 'hidden' }}>
          <div
            style={{
              padding: '14px 20px',
              borderBottom: `1px solid ${BORDER}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ fontFamily: "'Kaisei Decol', serif", fontSize: '16px' }}>
              Employees
            </span>
            <span style={{ fontSize: '12px', opacity: 0.5 }}>{employees.length} records</span>
          </div>
          {employees.length === 0 ? (
            <div style={{ padding: '52px 24px', textAlign: 'center', opacity: 0.36 }}>
              <div style={{ fontSize: '28px', marginBottom: '10px' }}>👥</div>
              <div style={{ fontSize: '13px' }}>No employees yet. Import a CSV to get started.</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Name</th>
                    <th style={thStyle}>Email</th>
                    <th style={thStyle}>Package</th>
                    <th style={thStyle}>Next Trigger</th>
                    <th style={thStyle}>Quiz</th>
                    <th style={thStyle}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp) => {
                    const nextTrigger = getNextTrigger(emp)
                    const onboardingTrigger = emp.triggers?.find(
                      (t) => t.type === 'onboarding' && t.status === 'pending'
                    )
                    return (
                      <tr
                        key={emp.id}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = 'rgba(246,77,37,0.025)')
                        }
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <td style={tdStyle}>
                          {emp.first_name} {emp.last_name}
                        </td>
                        <td style={{ ...tdStyle, opacity: 0.65 }}>{emp.email}</td>
                        <td style={tdStyle}>
                          {emp.package ? (
                            <Badge color="blue">{emp.package}</Badge>
                          ) : (
                            <span style={{ opacity: 0.3 }}>—</span>
                          )}
                        </td>
                        <td style={tdStyle}>
                          {nextTrigger ? (
                            <span style={{ fontSize: '13px' }}>
                              <Badge color="amber">{nextTrigger.type}</Badge>{' '}
                              <span style={{ opacity: 0.6 }}>
                                {new Date(nextTrigger.trigger_date).toLocaleDateString('en-GB')}
                              </span>
                            </span>
                          ) : (
                            <span style={{ opacity: 0.3 }}>—</span>
                          )}
                        </td>
                        <td style={tdStyle}>
                          {emp.quiz_completed_at ? (
                            <Badge color="green">Completed</Badge>
                          ) : (
                            <Badge color="orange">Pending</Badge>
                          )}
                        </td>
                        <td style={tdStyle}>
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            <ActionButton
                              label="Copy quiz link"
                              onClick={() => copyQuizLink(emp.quiz_token)}
                            />
                            {onboardingTrigger && (
                              <ActionButton
                                label="Fire onboarding"
                                variant="primary"
                                onClick={() => fireTrigger(onboardingTrigger.id)}
                              />
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Clients Tab */}
      {activeTab === 'clients' && (
        <div style={{ border: `1px solid ${BORDER}`, borderRadius: '4px', overflow: 'hidden' }}>
          <div
            style={{
              padding: '14px 20px',
              borderBottom: `1px solid ${BORDER}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ fontFamily: "'Kaisei Decol', serif", fontSize: '16px' }}>Clients</span>
            <span style={{ fontSize: '12px', opacity: 0.5 }}>{clients.length} records</span>
          </div>
          {clients.length === 0 ? (
            <div style={{ padding: '52px 24px', textAlign: 'center', opacity: 0.36 }}>
              <div style={{ fontSize: '28px', marginBottom: '10px' }}>🏢</div>
              <div style={{ fontSize: '13px' }}>No clients yet.</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Name</th>
                    <th style={thStyle}>Company</th>
                    <th style={thStyle}>Package</th>
                    <th style={thStyle}>Renewal Date</th>
                    <th style={thStyle}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map((client) => {
                    const renewalTrigger = client.triggers?.find(
                      (t) => t.type === 'renewal' && t.status === 'pending'
                    )
                    return (
                      <tr
                        key={client.id}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = 'rgba(246,77,37,0.025)')
                        }
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <td style={tdStyle}>
                          {client.first_name} {client.last_name}
                        </td>
                        <td style={{ ...tdStyle, opacity: 0.65 }}>
                          {client.company_name ?? '—'}
                        </td>
                        <td style={tdStyle}>
                          {client.package ? (
                            <Badge color="blue">{client.package}</Badge>
                          ) : (
                            <span style={{ opacity: 0.3 }}>—</span>
                          )}
                        </td>
                        <td style={tdStyle}>
                          {client.renewal_date ? (
                            <span style={{ fontSize: '13px' }}>
                              {new Date(client.renewal_date).toLocaleDateString('en-GB')}
                            </span>
                          ) : (
                            <span style={{ opacity: 0.3 }}>—</span>
                          )}
                        </td>
                        <td style={tdStyle}>
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            {renewalTrigger && (
                              <ActionButton
                                label="Generate renewal video"
                                variant="primary"
                                onClick={() => fireTrigger(renewalTrigger.id)}
                              />
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Prospects Tab */}
      {activeTab === 'prospects' && (
        <div style={{ border: `1px solid ${BORDER}`, borderRadius: '4px', overflow: 'hidden' }}>
          <div
            style={{
              padding: '14px 20px',
              borderBottom: `1px solid ${BORDER}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ fontFamily: "'Kaisei Decol', serif", fontSize: '16px' }}>
              Prospects
            </span>
            <span style={{ fontSize: '12px', opacity: 0.5 }}>{prospects.length} records</span>
          </div>
          {prospects.length === 0 ? (
            <div style={{ padding: '52px 24px', textAlign: 'center', opacity: 0.36 }}>
              <div style={{ fontSize: '28px', marginBottom: '10px' }}>🎯</div>
              <div style={{ fontSize: '13px' }}>No prospects yet.</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Name</th>
                    <th style={thStyle}>Company</th>
                    <th style={thStyle}>Package</th>
                    <th style={thStyle}>Status</th>
                    <th style={thStyle}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {prospects.map((prospect) => {
                    const outreachTrigger = prospect.triggers?.find(
                      (t) => t.type === 'outreach' && t.status === 'pending'
                    )
                    return (
                      <tr
                        key={prospect.id}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = 'rgba(246,77,37,0.025)')
                        }
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <td style={tdStyle}>
                          {prospect.first_name} {prospect.last_name}
                        </td>
                        <td style={{ ...tdStyle, opacity: 0.65 }}>
                          {prospect.company_name ?? '—'}
                        </td>
                        <td style={tdStyle}>
                          {prospect.package ? (
                            <Badge color="blue">{prospect.package}</Badge>
                          ) : (
                            <span style={{ opacity: 0.3 }}>—</span>
                          )}
                        </td>
                        <td style={tdStyle}>
                          <Badge color={prospect.status === 'active' ? 'green' : 'grey'}>
                            {prospect.status}
                          </Badge>
                        </td>
                        <td style={tdStyle}>
                          {outreachTrigger && (
                            <ActionButton
                              label="Fire outreach"
                              variant="primary"
                              onClick={() => fireTrigger(outreachTrigger.id)}
                            />
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Log Tab */}
      {activeTab === 'log' && (
        <div style={{ border: `1px solid ${BORDER}`, borderRadius: '4px', overflow: 'hidden' }}>
          <div
            style={{
              padding: '14px 20px',
              borderBottom: `1px solid ${BORDER}`,
            }}
          >
            <span style={{ fontFamily: "'Kaisei Decol', serif", fontSize: '16px' }}>
              Actions Log
            </span>
          </div>
          {actionsLog.length === 0 ? (
            <div style={{ padding: '52px 24px', textAlign: 'center', opacity: 0.36 }}>
              <div style={{ fontSize: '28px', marginBottom: '10px' }}>📋</div>
              <div style={{ fontSize: '13px' }}>No actions logged yet.</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Date</th>
                    <th style={thStyle}>Person</th>
                    <th style={thStyle}>Action</th>
                    <th style={thStyle}>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {actionsLog.map((log) => {
                    const person = log.triggers?.persons
                    const isSuccess = [
                      'email_sent',
                      'video_ready',
                      'landing_page_created',
                    ].includes(log.action_type)
                    const isFailure = log.action_type.includes('fail')
                    const rowBg = isSuccess
                      ? 'rgba(34,197,94,0.03)'
                      : isFailure
                      ? 'rgba(220,38,38,0.03)'
                      : 'transparent'
                    return (
                      <tr key={log.id} style={{ background: rowBg }}>
                        <td style={{ ...tdStyle, fontSize: '12px', opacity: 0.7, whiteSpace: 'nowrap' }}>
                          {new Date(log.created_at).toLocaleString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td style={tdStyle}>
                          {person ? (
                            <span>
                              {person.first_name} {person.last_name}
                              <br />
                              <span style={{ fontSize: '12px', opacity: 0.55 }}>{person.email}</span>
                            </span>
                          ) : (
                            <span style={{ opacity: 0.3 }}>—</span>
                          )}
                        </td>
                        <td style={tdStyle}>
                          <span
                            style={{
                              fontSize: '12px',
                              fontWeight: 500,
                              ...actionTypeColor(log.action_type),
                            }}
                          >
                            {log.action_type.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td style={{ ...tdStyle, maxWidth: '300px' }}>
                          {log.payload ? (
                            <code
                              style={{
                                fontSize: '11px',
                                opacity: 0.7,
                                background: 'rgba(246,77,37,0.04)',
                                padding: '2px 6px',
                                borderRadius: '3px',
                                display: 'block',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                maxWidth: '300px',
                              }}
                              title={JSON.stringify(log.payload, null, 2)}
                            >
                              {JSON.stringify(log.payload)}
                            </code>
                          ) : (
                            <span style={{ opacity: 0.3 }}>—</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
