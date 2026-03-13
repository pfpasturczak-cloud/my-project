'use client'

import Link from 'next/link'

export default function Home() {
  return (
    <>
      <div className="wrapper">
        <p className="eyebrow">AI-Powered Property Media</p>
        <h1>
          Vis<em>ora</em>
        </h1>
        <p className="tagline">Images &amp; video for residential sales</p>
        <div className="divider" />
        <nav className="nav-grid">
          <Link href="/gallery" className="nav-btn">
            <span>View Gallery</span>
            <span className="arrow">→</span>
          </Link>
          <Link href="/auth/login" className="nav-btn">
            <span>Client Portal</span>
            <span className="arrow">→</span>
          </Link>
          <Link href="/admin" className="nav-btn admin-btn">
            <span>Admin Panel</span>
            <span className="arrow">→</span>
          </Link>
        </nav>
      </div>
      <p className="footer">© 2026 Visora — All rights reserved</p>

      <style jsx>{`
        .wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100vh;
          padding: 2rem;
          position: relative;
          overflow: hidden;
        }

        .wrapper::after {
          content: '';
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -60%);
          width: 600px;
          height: 400px;
          background: radial-gradient(ellipse, rgba(201, 169, 110, 0.06) 0%, transparent 70%);
          pointer-events: none;
        }

        .eyebrow {
          font-family: 'Geist Mono', monospace;
          font-size: 0.65rem;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: var(--accent);
          margin-bottom: 2rem;
          opacity: 0;
          animation: fadeUp 0.8s ease 0.2s forwards;
        }

        h1 {
          font-family: 'Cormorant Garamond', serif;
          font-weight: 300;
          font-size: clamp(3.5rem, 8vw, 7rem);
          line-height: 1;
          letter-spacing: -0.02em;
          text-align: center;
          color: var(--off-white);
          opacity: 0;
          animation: fadeUp 0.8s ease 0.4s forwards;
        }

        h1 em {
          font-style: italic;
          color: var(--accent);
        }

        .tagline {
          margin-top: 1.5rem;
          font-size: 0.7rem;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: var(--warm-grey);
          text-align: center;
          opacity: 0;
          animation: fadeUp 0.8s ease 0.6s forwards;
        }

        .divider {
          width: 1px;
          height: 48px;
          background: linear-gradient(to bottom, transparent, var(--accent), transparent);
          margin: 2.5rem auto;
          opacity: 0;
          animation: fadeUp 0.8s ease 0.8s forwards;
        }

        .nav-grid {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          width: 100%;
          max-width: 320px;
          opacity: 0;
          animation: fadeUp 0.8s ease 1s forwards;
        }

        .nav-btn {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 1.25rem;
          border: 1px solid rgba(240, 237, 232, 0.1);
          background: rgba(240, 237, 232, 0.02);
          color: var(--off-white);
          text-decoration: none;
          font-family: 'Geist Mono', monospace;
          font-size: 0.7rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          transition: all 0.25s ease;
          cursor: pointer;
          position: relative;
          overflow: hidden;
        }

        .nav-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          background: var(--accent-dim);
          transform: translateX(-100%);
          transition: transform 0.3s ease;
        }

        .nav-btn:hover::before {
          transform: translateX(0);
        }

        .nav-btn:hover {
          border-color: var(--accent);
          color: var(--accent);
        }

        .nav-btn .arrow {
          font-size: 0.9rem;
          transition: transform 0.25s ease;
          position: relative;
        }

        .nav-btn:hover .arrow {
          transform: translateX(4px);
        }

        .nav-btn span:first-child {
          position: relative;
        }

        .footer {
          position: fixed;
          bottom: 2rem;
          left: 50%;
          transform: translateX(-50%);
          font-size: 0.6rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: rgba(160, 152, 144, 0.4);
          opacity: 0;
          animation: fadeUp 0.8s ease 1.2s forwards;
          white-space: nowrap;
        }

        @media (max-width: 480px) {
          h1 { font-size: 3rem; }
        }
      `}</style>
    </>
  )
}
