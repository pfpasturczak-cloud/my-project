'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '../lib/supabase/client'

export default function Header({ role }) {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <>
      <header className="portal-header">
        <Link href={role === 'admin' ? '/admin' : '/dashboard'} className="logo">
          Vis<em>ora</em>
        </Link>
        <div className="header-right">
          {role === 'admin' && (
            <span className="role-badge">Admin</span>
          )}
          <button className="logout-btn" onClick={handleLogout}>
            Sign out
          </button>
        </div>
      </header>

      <style jsx>{`
        .portal-header {
          position: sticky;
          top: 0;
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.25rem 2rem;
          border-bottom: 1px solid var(--border);
          background: rgba(10, 10, 10, 0.92);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
        }

        .logo {
          font-family: 'Cormorant Garamond', serif;
          font-weight: 300;
          font-size: 1.5rem;
          letter-spacing: 0.02em;
          color: var(--off-white);
          text-decoration: none;
        }

        .logo em {
          font-style: italic;
          color: var(--accent);
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 1.25rem;
        }

        .role-badge {
          font-size: 0.55rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--accent);
          border: 1px solid var(--accent);
          padding: 0.2rem 0.6rem;
        }

        .logout-btn {
          background: none;
          border: none;
          font-family: 'Geist Mono', monospace;
          font-size: 0.65rem;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: var(--warm-grey);
          cursor: pointer;
          transition: color 0.2s;
          padding: 0;
        }

        .logout-btn:hover {
          color: var(--accent);
        }
      `}</style>
    </>
  )
}
