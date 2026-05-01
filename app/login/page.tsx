'use client'

import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root { --accent: #f64d25; --bg: #f7f6f2; }
        html, body { height: 100%; background: var(--bg); color: var(--accent); font-family: 'DM Sans', sans-serif; }
        a { text-decoration: none; color: inherit; }
        .page { min-height: 100vh; display: grid; grid-template-columns: 1fr 1fr; }
        .panel-form { display: flex; flex-direction: column; justify-content: space-between; padding: 48px 6vw; }
        .panel-form-top { display: flex; justify-content: space-between; align-items: center; }
        .logo { font-family: 'Kaisei Decol', serif; font-size: 20px; color: var(--accent); }
        .back-link { font-size: 13px; letter-spacing: 0.06em; text-transform: uppercase; opacity: 0.55; transition: opacity 0.2s; }
        .back-link:hover { opacity: 1; }
        .form-wrap { width: 100%; max-width: 400px; margin: 0 auto; }
        .form-title { font-family: 'Kaisei Decol', serif; font-size: clamp(32px, 3.5vw, 54px); line-height: 1.05; letter-spacing: -0.025em; margin-bottom: 10px; }
        .form-sub { font-size: 15px; line-height: 1.40; opacity: 0.62; margin-bottom: 40px; }
        .field { margin-bottom: 16px; }
        .field label { display: block; font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; opacity: 0.55; margin-bottom: 8px; }
        .field input { width: 100%; padding: 14px 16px; background: transparent; border: 1.5px solid rgba(246,77,37,0.25); color: var(--accent); font-family: 'DM Sans', sans-serif; font-size: 14px; outline: none; transition: border-color 0.2s; border-radius: 2px; }
        .field input::placeholder { opacity: 0.3; }
        .field input:focus { border-color: var(--accent); }
        .forgot { display: block; text-align: right; font-size: 13px; opacity: 0.52; margin-top: 8px; transition: opacity 0.2s; }
        .forgot:hover { opacity: 0.8; }
        .btn-login { width: 100%; margin-top: 28px; padding: 15px; background: var(--accent); color: var(--bg); border: none; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500; letter-spacing: 0.06em; text-transform: uppercase; cursor: pointer; transition: opacity 0.2s; border-radius: 2px; }
        .btn-login:hover { opacity: 0.82; }
        .divider { display: flex; align-items: center; gap: 16px; margin: 24px 0; }
        .divider::before, .divider::after { content: ''; flex: 1; height: 1px; background: rgba(246,77,37,0.15); }
        .divider span { font-size: 13px; opacity: 0.48; letter-spacing: 0.08em; }
        .signup-cta { text-align: center; font-size: 14px; opacity: 0.62; }
        .signup-cta a { opacity: 1; font-weight: 500; border-bottom: 1px solid currentColor; padding-bottom: 1px; }
        .panel-form-foot { font-size: 13px; opacity: 0.42; letter-spacing: 0.04em; }
        .panel-art { background: var(--accent); position: relative; overflow: hidden; display: flex; flex-direction: column; justify-content: flex-end; padding: 48px 5vw; }
        .panel-art::before { content: ''; position: absolute; inset: 0; background: repeating-linear-gradient(-52deg, rgba(247,246,242,0.07) 0px, rgba(247,246,242,0.07) 30px, transparent 30px, transparent 60px); }
        .art-quote { position: relative; z-index: 1; }
        .art-quote blockquote { font-family: 'Kaisei Decol', serif; font-size: clamp(23px, 2.5vw, 38px); line-height: 1.25; letter-spacing: -0.02em; color: var(--bg); margin-bottom: 20px; }
        .art-quote cite { font-size: 14px; color: var(--bg); opacity: 0.72; font-style: normal; font-weight: 500; letter-spacing: 0.06em; text-transform: uppercase; }
        .art-stat { position: absolute; top: 48px; left: 5vw; color: var(--bg); z-index: 1; }
        .art-stat-num { font-family: 'Kaisei Decol', serif; font-size: clamp(56px, 6vw, 96px); line-height: 1; letter-spacing: -0.03em; opacity: 0.9; }
        .art-stat-label { font-size: 14px; opacity: 0.7; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase; margin-top: 8px; }
        @media (max-width: 768px) { .page { grid-template-columns: 1fr; } .panel-art { display: none; } .panel-form { padding: 36px 5vw; } }
      `}</style>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link href="https://fonts.googleapis.com/css2?family=Kaisei+Decol:wght@400;700&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap" rel="stylesheet" />

      <div className="page">
        <div className="panel-art">
          <div className="art-stat">
            <div className="art-stat-num">97%</div>
            <div className="art-stat-label">of recipients remember the gesture</div>
          </div>
          <div className="art-quote">
            <blockquote>
              {'“culturers completely changed how our team feels about coming to work.”'}
            </blockquote>
            <cite>Head of People, Series B startup · Amsterdam</cite>
          </div>
        </div>

        <div className="panel-form">
          <div className="panel-form-top">
            <a className="logo" href="/">culturers</a>
            <a className="back-link" href="/">← Back to home</a>
          </div>

          <div className="form-wrap">
            <h1 className="form-title">Welcome<br />back.</h1>
            <p className="form-sub">Sign in to manage your celebrations.</p>

            <form onSubmit={(e) => { e.preventDefault(); router.push('/dashboard') }}>
              <div className="field">
                <label htmlFor="email">Email address</label>
                <input type="email" id="email" placeholder="you@company.com" autoComplete="email" />
              </div>
              <div className="field">
                <label htmlFor="password">Password</label>
                <input type="password" id="password" placeholder="••••••••" autoComplete="current-password" />
                <a className="forgot" href="#">Forgot password?</a>
              </div>
              <button type="submit" className="btn-login">Sign in →</button>
            </form>

            <div className="divider"><span>or</span></div>
            <p className="signup-cta">New to culturers? <a href="#">Request access ↗</a></p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <p className="panel-form-foot">© 2026 culturers. All rights reserved.</p>
          </div>
        </div>
      </div>
    </>
  )
}
