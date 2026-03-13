'use client'

import { useState } from 'react'

export default function DeliverableSection({ project, deliverables, isAdmin }) {
  const [lightboxItem, setLightboxItem] = useState(null)

  const isReady = ['ready', 'complete'].includes(project.status)

  if (!isReady && !isAdmin) {
    return (
      <>
        <div className="locked-state">
          <p className="locked-icon">⬡</p>
          <p className="locked-title">Not ready yet</p>
          <p className="locked-sub">
            You'll receive an email as soon as your content is ready to preview.
          </p>
        </div>
        <style jsx>{`
          .locked-state {
            padding: 3rem;
            border: 1px solid var(--border);
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            gap: 0.75rem;
          }
          .locked-icon {
            font-size: 1.5rem;
            color: var(--border-subtle);
          }
          .locked-title {
            font-family: 'Cormorant Garamond', serif;
            font-size: 1.25rem;
            font-weight: 300;
            color: var(--warm-grey);
          }
          .locked-sub {
            font-size: 0.62rem;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            color: var(--warm-grey);
            max-width: 320px;
            line-height: 1.8;
          }
        `}</style>
      </>
    )
  }

  if (deliverables.length === 0) {
    return (
      <>
        <div className="empty-deliverables">
          <p className="empty-text">No deliverables uploaded yet.</p>
        </div>
        <style jsx>{`
          .empty-deliverables {
            padding: 2rem;
            border: 1px solid var(--border);
          }
          .empty-text {
            font-size: 0.65rem;
            letter-spacing: 0.1em;
            color: var(--warm-grey);
            text-transform: uppercase;
          }
        `}</style>
      </>
    )
  }

  return (
    <>
      {/* Payment CTA — shown to client, inactive for now */}
      {!isAdmin && project.status === 'ready' && (
        <div className="payment-bar">
          <div>
            <p className="payment-label">Payment required to download</p>
            <p className="payment-sub">Preview below. Full resolution unlocks after payment.</p>
          </div>
          <button className="pay-btn" disabled>
            Pay to download <span className="coming-soon">Coming soon</span>
          </button>
        </div>
      )}

      <div className="deliverable-grid">
        {deliverables.map(asset => (
          <div
            key={asset.id}
            className="deliverable-item"
            onClick={() => setLightboxItem(asset)}
          >
            {/* Protective overlay — blocks right-click and drag */}
            <div className="protective-overlay" onContextMenu={e => e.preventDefault()} />

            {/* Watermark */}
            {!isAdmin && (
              <div className="watermark">
                <span>Vis<em>ora</em> — Not for distribution</span>
              </div>
            )}

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={asset.signedUrl}
              alt={asset.file_name}
              loading="lazy"
              draggable={false}
              onContextMenu={e => !isAdmin && e.preventDefault()}
            />
            <p className="asset-name">{asset.file_name}</p>
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxItem && (
        <div
          className="lightbox"
          onClick={e => { if (e.target === e.currentTarget) setLightboxItem(null) }}
        >
          <button className="lightbox-close" onClick={() => setLightboxItem(null)}>
            ✕ Close
          </button>
          <div className="lightbox-inner" onContextMenu={e => !isAdmin && e.preventDefault()}>
            {!isAdmin && <div className="lightbox-watermark">Visora — Preview only</div>}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightboxItem.signedUrl}
              alt={lightboxItem.file_name}
              draggable={false}
            />
          </div>
        </div>
      )}

      <style jsx>{`
        .payment-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          padding: 1.25rem 1.5rem;
          border: 1px solid var(--accent);
          background: var(--accent-dim);
          margin-bottom: 1.25rem;
          flex-wrap: wrap;
        }

        .payment-label {
          font-size: 0.7rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--accent);
        }

        .payment-sub {
          font-size: 0.6rem;
          letter-spacing: 0.08em;
          color: var(--warm-grey);
          margin-top: 0.25rem;
          text-transform: uppercase;
        }

        .pay-btn {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1.25rem;
          background: none;
          border: 1px solid var(--accent);
          color: var(--accent);
          font-family: 'Geist Mono', monospace;
          font-size: 0.65rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          cursor: not-allowed;
          opacity: 0.6;
          white-space: nowrap;
        }

        .coming-soon {
          font-size: 0.55rem;
          border: 1px solid currentColor;
          padding: 0.1rem 0.4rem;
          letter-spacing: 0.1em;
        }

        .deliverable-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 1rem;
        }

        .deliverable-item {
          position: relative;
          border: 1px solid var(--border);
          overflow: hidden;
          cursor: pointer;
          background: #111;
          user-select: none;
          -webkit-user-select: none;
        }

        .deliverable-item:hover {
          border-color: var(--accent);
        }

        /* Transparent click-capture overlay */
        .protective-overlay {
          position: absolute;
          inset: 0;
          z-index: 10;
          background: transparent;
        }

        .watermark {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 20;
          padding: 0.5rem 0.75rem;
          background: rgba(10, 10, 10, 0.7);
          font-size: 0.55rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(201, 169, 110, 0.7);
          pointer-events: none;
        }

        .watermark em {
          font-style: italic;
        }

        .deliverable-item img {
          display: block;
          width: 100%;
          height: 180px;
          object-fit: cover;
          pointer-events: none;
        }

        .asset-name {
          padding: 0.5rem 0.75rem;
          font-size: 0.55rem;
          letter-spacing: 0.05em;
          color: var(--warm-grey);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          position: relative;
          z-index: 5;
        }

        /* Lightbox */
        .lightbox {
          position: fixed;
          inset: 0;
          z-index: 500;
          background: rgba(10, 10, 10, 0.97);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
        }

        .lightbox-inner {
          position: relative;
        }

        .lightbox-inner img {
          max-width: 90vw;
          max-height: 85vh;
          object-fit: contain;
          display: block;
          pointer-events: none;
          user-select: none;
          -webkit-user-select: none;
        }

        .lightbox-watermark {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 0.75rem 1rem;
          background: rgba(10, 10, 10, 0.75);
          font-size: 0.6rem;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: rgba(201, 169, 110, 0.6);
          text-align: center;
          pointer-events: none;
          z-index: 10;
        }

        .lightbox-close {
          position: fixed;
          top: 1.5rem;
          right: 1.5rem;
          background: none;
          border: 1px solid var(--border);
          color: var(--warm-grey);
          font-size: 0.65rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          padding: 0.5rem 0.9rem;
          cursor: pointer;
          font-family: 'Geist Mono', monospace;
          transition: all 0.2s;
        }

        .lightbox-close:hover {
          border-color: var(--accent);
          color: var(--accent);
        }
      `}</style>
    </>
  )
}
