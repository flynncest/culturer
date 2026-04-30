import { createClient } from '@/lib/supabase/server'
import QuizForm from '@/components/QuizForm'

export default async function QuizPage({ params }: { params: { token: string } }) {
  const supabase = createClient()

  const { data: person } = await supabase
    .from('persons')
    .select('id, first_name, last_name, type, quiz_token, quiz_completed_at')
    .eq('quiz_token', params.token)
    .maybeSingle()

  if (!person) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#f7f6f2',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: "'DM Sans', sans-serif",
          color: '#f64d25',
        }}
      >
        <div style={{ textAlign: 'center', maxWidth: '400px', padding: '24px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
          <h1
            style={{
              fontFamily: "'Kaisei Decol', serif",
              fontSize: '28px',
              marginBottom: '12px',
            }}
          >
            Link not found
          </h1>
          <p style={{ opacity: 0.6, lineHeight: 1.6 }}>
            This quiz link is invalid or has been removed.
          </p>
        </div>
      </div>
    )
  }

  if (person.quiz_completed_at) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#f7f6f2',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: "'DM Sans', sans-serif",
          color: '#f64d25',
        }}
      >
        <div style={{ textAlign: 'center', maxWidth: '400px', padding: '24px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
          <h1
            style={{
              fontFamily: "'Kaisei Decol', serif",
              fontSize: '28px',
              marginBottom: '12px',
            }}
          >
            Already completed!
          </h1>
          <p style={{ opacity: 0.6, lineHeight: 1.6 }}>
            Thanks {person.first_name} &mdash; you&apos;ve already filled in your quiz. We&apos;ve got everything
            we need!
          </p>
        </div>
      </div>
    )
  }

  return (
    <QuizForm
      token={params.token}
      firstName={person.first_name}
      personType={person.type as 'employee' | 'client' | 'prospect'}
    />
  )
}
