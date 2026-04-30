import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen" style={{ background: '#f7f6f2', color: '#f64d25' }}>
      {/* Top border accent */}
      <div style={{ height: '3px', background: '#f64d25', width: '100%' }} />

      {/* Nav */}
      <nav
        style={{
          borderBottom: '1px solid rgba(246,77,37,0.14)',
          padding: '0 32px',
          height: '56px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Link
          href="/"
          style={{
            fontFamily: "'Kaisei Decol', serif",
            fontSize: '20px',
            color: '#f64d25',
            textDecoration: 'none',
            letterSpacing: '-0.01em',
          }}
        >
          culturers
        </Link>
        <span
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '13px',
            opacity: 0.48,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          Dashboard
        </span>
      </nav>

      {/* Page content */}
      <main>{children}</main>
    </div>
  )
}
