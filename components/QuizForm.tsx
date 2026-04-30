'use client'

import { useState } from 'react'

const ACCENT = '#f64d25'
const BG = '#f7f6f2'
const BORDER = 'rgba(246,77,37,0.14)'

type Props = {
  token: string
  firstName: string
  personType: 'employee' | 'client' | 'prospect'
}

export default function QuizForm({ token, firstName, personType }: Props) {
  const [favouriteTreat, setFavouriteTreat] = useState('')
  const [hobbies, setHobbies] = useState('')
  const [giftPreference, setGiftPreference] = useState<'experience' | 'physical' | 'food' | ''>('')
  const [tshirtSize, setTshirtSize] = useState('')
  const [extraNotes, setExtraNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const showTshirt = personType === 'employee'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          favourite_treat: favouriteTreat || null,
          hobbies: hobbies || null,
          gift_preference: giftPreference || null,
          tshirt_size: showTshirt ? (tshirtSize || null) : null,
          extra_notes: extraNotes || null,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong. Please try again.')
      } else {
        setSubmitted(true)
      }
    } catch {
      setError('Network error — please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    padding: '10px 13px',
    background: 'transparent',
    border: `1.5px solid ${BORDER}`,
    color: ACCENT,
    fontFamily: "'DM Sans', sans-serif",
    fontSize: '13px',
    outline: 'none',
    borderRadius: '3px',
    width: '100%',
    transition: 'border-color 0.2s',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: '11px',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    opacity: 0.52,
    display: 'block',
    marginBottom: '6px',
    fontFamily: "'DM Sans', sans-serif",
    color: ACCENT,
  }

  const radioCardStyle = (selected: boolean): React.CSSProperties => ({
    border: `1.5px solid ${selected ? ACCENT : BORDER}`,
    borderRadius: '4px',
    padding: '14px 16px',
    cursor: 'pointer',
    transition: 'all 0.15s',
    background: selected ? 'rgba(246,77,37,0.05)' : 'transparent',
    flex: 1,
    textAlign: 'center',
  })

  if (submitted) {
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
        <div style={{ textAlign: 'center', maxWidth: '480px' }}>
          <div style={{ fontSize: '56px', marginBottom: '20px' }}>🎉</div>
          <h1
            style={{
              fontFamily: "'Kaisei Decol', serif",
              fontSize: '36px',
              marginBottom: '16px',
              letterSpacing: '-0.01em',
            }}
          >
            Thank you, {firstName}!
          </h1>
          <p
            style={{
              fontSize: '16px',
              opacity: 0.7,
              lineHeight: 1.7,
              marginBottom: '32px',
            }}
          >
            We&apos;ve got everything we need to make sure we celebrate you in the most personal way.
            Look out for something special from us!
          </p>
          <p
            style={{
              fontSize: '13px',
              opacity: 0.45,
              fontFamily: "'Kaisei Decol', serif",
            }}
          >
            culturers
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: BG,
        fontFamily: "'DM Sans', sans-serif",
        color: ACCENT,
        padding: '48px 24px',
      }}
    >
      <div style={{ maxWidth: '560px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '40px' }}>
          <p
            style={{
              fontFamily: "'Kaisei Decol', serif",
              fontSize: '14px',
              opacity: 0.5,
              marginBottom: '8px',
            }}
          >
            culturers
          </p>
          <h1
            style={{
              fontFamily: "'Kaisei Decol', serif",
              fontSize: '36px',
              letterSpacing: '-0.02em',
              marginBottom: '12px',
              lineHeight: 1.1,
            }}
          >
            Hey {firstName} 👋
          </h1>
          <p style={{ fontSize: '16px', opacity: 0.65, lineHeight: 1.6 }}>
            We love celebrating the people who matter. Help us make those moments truly personal by
            telling us a little about yourself — it only takes 2 minutes.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Favourite treat */}
          <div style={{ marginBottom: '24px' }}>
            <label style={labelStyle}>Favourite treat or snack</label>
            <input
              type="text"
              placeholder="e.g. dark chocolate, sushi, oat milk latte..."
              value={favouriteTreat}
              onChange={(e) => setFavouriteTreat(e.target.value)}
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = ACCENT)}
              onBlur={(e) => (e.target.style.borderColor = BORDER)}
            />
          </div>

          {/* Hobbies */}
          <div style={{ marginBottom: '24px' }}>
            <label style={labelStyle}>Hobbies & interests</label>
            <input
              type="text"
              placeholder="e.g. hiking, photography, cooking, reading sci-fi..."
              value={hobbies}
              onChange={(e) => setHobbies(e.target.value)}
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = ACCENT)}
              onBlur={(e) => (e.target.style.borderColor = BORDER)}
            />
          </div>

          {/* Gift preference */}
          <div style={{ marginBottom: '24px' }}>
            <label style={labelStyle}>I prefer gifts that are...</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              {(['experience', 'physical', 'food'] as const).map((pref) => (
                <div
                  key={pref}
                  style={radioCardStyle(giftPreference === pref)}
                  onClick={() => setGiftPreference(pref)}
                >
                  <div style={{ fontSize: '22px', marginBottom: '6px' }}>
                    {pref === 'experience' ? '🎟️' : pref === 'physical' ? '🎁' : '🍽️'}
                  </div>
                  <div
                    style={{
                      fontSize: '13px',
                      fontWeight: 500,
                      textTransform: 'capitalize',
                    }}
                  >
                    {pref}
                  </div>
                  <div style={{ fontSize: '11px', opacity: 0.55, marginTop: '3px' }}>
                    {pref === 'experience'
                      ? 'Events & activities'
                      : pref === 'physical'
                      ? 'Tangible gifts'
                      : 'Food & drink'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* T-shirt size (employees only) */}
          {showTshirt && (
            <div style={{ marginBottom: '24px' }}>
              <label style={labelStyle}>T-shirt size</label>
              <select
                value={tshirtSize}
                onChange={(e) => setTshirtSize(e.target.value)}
                style={{
                  ...inputStyle,
                  cursor: 'pointer',
                  backgroundImage:
                    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='%23f64d25' fill-opacity='.4' d='M1 1l5 5 5-5'/%3E%3C/svg%3E\")",
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 12px center',
                  paddingRight: '32px',
                  appearance: 'none',
                }}
                onFocus={(e) => (e.target.style.borderColor = ACCENT)}
                onBlur={(e) => (e.target.style.borderColor = BORDER)}
              >
                <option value="">Select a size...</option>
                {['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Extra notes */}
          <div style={{ marginBottom: '32px' }}>
            <label style={labelStyle}>Anything else we should know?</label>
            <textarea
              placeholder="Allergies, dietary requirements, things you absolutely love or hate..."
              value={extraNotes}
              onChange={(e) => setExtraNotes(e.target.value)}
              rows={3}
              style={{
                ...inputStyle,
                resize: 'vertical',
                minHeight: '80px',
              }}
              onFocus={(e) => (e.target.style.borderColor = ACCENT)}
              onBlur={(e) => (e.target.style.borderColor = BORDER)}
            />
          </div>

          {/* Error */}
          {error && (
            <div
              style={{
                padding: '12px 16px',
                background: 'rgba(220,38,38,0.08)',
                border: '1px solid rgba(220,38,38,0.2)',
                borderRadius: '3px',
                color: '#dc2626',
                fontSize: '13px',
                marginBottom: '16px',
              }}
            >
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px 24px',
              background: ACCENT,
              color: BG,
              border: 'none',
              borderRadius: '4px',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '15px',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              transition: 'opacity 0.15s',
            }}
          >
            {loading ? 'Submitting...' : 'Submit my preferences →'}
          </button>
        </form>
      </div>
    </div>
  )
}
