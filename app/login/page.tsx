'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const ACCENT = '#f64d25'
const BG = '#f7f6f2'
const BORDER = 'rgba(246,77,37,0.14)'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
    } else {
      router.push('/')
      router.refresh()
    }
  }

  const inputStyle: React.CSSProperties = {
    padding: '12px 14px',
    background: 'transparent',
    border: `1.5px solid ${BORDER}`,
    color: ACCENT,
    fontFamily: "'DM Sans', sans-serif",
    fontSize: '14px',
    outline: 'none',
    borderRadius: '3px',
    width: '100%',
    transition: 'border-color 0.2s',
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: BG,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'DM Sans', sans-serif",
        color: ACCENT,
        padding: '24px',
      }}
    >
      <div style={{ width: '100%', maxWidth: '400px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1
            style={{
              fontFamily: "'Kaisei Decol', serif",
              fontSize: '32px',
              letterSpacing: '-0.02em',
              marginBottom: '8px',
            }}
          >
            culturers
          </h1>
          <p style={{ fontSize: '14px', opacity: 0.55 }}>Sign in to your dashboard</p>
        </div>

        {/* Card */}
        <div
          style={{
            border: `1px solid ${BORDER}`,
            borderRadius: '6px',
            padding: '32px',
          }}
        >
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '20px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '11px',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  opacity: 0.52,
                  marginBottom: '6px',
                }}
              >
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = ACCENT)}
                onBlur={(e) => (e.target.style.borderColor = BORDER)}
              />
            </div>

            <div style={{ marginBottom: '28px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '11px',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  opacity: 0.52,
                  marginBottom: '6px',
                }}
              >
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = ACCENT)}
                onBlur={(e) => (e.target.style.borderColor = BORDER)}
              />
            </div>

            {error && (
              <div
                style={{
                  padding: '10px 14px',
                  background: 'rgba(220,38,38,0.08)',
                  border: '1px solid rgba(220,38,38,0.2)',
                  borderRadius: '3px',
                  color: '#dc2626',
                  fontSize: '13px',
                  marginBottom: '20px',
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px 24px',
                background: ACCENT,
                color: BG,
                border: 'none',
                borderRadius: '3px',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '14px',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                transition: 'opacity 0.15s',
                letterSpacing: '0.02em',
              }}
            >
              {loading ? 'Signing in...' : 'Sign in →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
