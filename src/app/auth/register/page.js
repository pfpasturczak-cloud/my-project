'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '../../../lib/supabase/client'

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    // Profile row is created automatically via database trigger
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <>
      <div className="auth-wrap">
        <div className="auth-box" style={{ opacity: 0, animation: 'fadeUp 0.8s ease 0.2s forwards' }}>
          <Link href="/" className="logo">
            Vis<em>ora</em>
          </Link>
          <p className="auth-title">Create account</p>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="field">
              <label className="label">Full name</label>
              <input
                className="input"
                type="text"
                placeholder="Jane Smith"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                autoComplete="name"
              />
            </div>

            <div className="field">
              <label className="label">Email</label>
              <input
                className="input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="field">
              <label className="label">Password</label>
              <input
                className="input"
                type="password"
                placeholder="Min. 8 characters"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>

            {error && <p className="error-msg">{error}</p>}

            <button className="btn-primary" type="submit" disabled={loading}>
              <span>{loading ? 'Creating account...' : 'Create account'}</span>
              {!loading && <span>→</span>}
            </button>
          </form>

          <p className="auth-footer">
            Already have an account?{' '}
            <Link href="/auth/login" className="auth-link">
              Sign in
            </Link>
          </p>
        </div>
      </div>

      <style jsx>{`
        .auth-wrap {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
        }

        .auth-box {
          width: 100%;
          max-width: 380px;
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .logo {
          font-family: 'Cormorant Garamond', serif;
          font-weight: 300;
          font-size: 1.75rem;
          letter-spacing: 0.02em;
          color: var(--off-white);
          text-decoration: none;
        }

        .logo em {
          font-style: italic;
          color: var(--accent);
        }

        .auth-title {
          font-size: 0.65rem;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: var(--warm-grey);
          margin-top: -1rem;
        }

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .field {
          display: flex;
          flex-direction: column;
        }

        .auth-footer {
          font-size: 0.65rem;
          letter-spacing: 0.1em;
          color: var(--warm-grey);
          text-align: center;
        }

        .auth-link {
          color: var(--accent);
          text-decoration: none;
          transition: opacity 0.2s;
        }

        .auth-link:hover {
          opacity: 0.75;
        }
      `}</style>
    </>
  )
}
