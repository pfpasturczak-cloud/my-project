'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { createClient } from '../../lib/supabase/client'

const IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif']
const VIDEO_EXTS = ['mp4', 'webm', 'mov']

export default function GalleryPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lightboxItem, setLightboxItem] = useState(null)

  useEffect(() => {
    loadMedia()
  }, [])

  async function loadMedia() {
    try {
      const supabase = createClient()
      const { data, error } = await supabase.storage.from('gallery').list('', {
        limit: 200,
        sortBy: { column: 'created_at', order: 'desc' },
      })

      if (error) throw error

      const mediaFiles = (data || [])
        .filter(f => {
          const ext = f.name.split('.').pop().toLowerCase()
          return IMAGE_EXTS.includes(ext) || VIDEO_EXTS.includes(ext)
        })
        .map(f => {
          const ext = f.name.split('.').pop().toLowerCase()
          const { data: urlData } = supabase.storage.from('gallery').getPublicUrl(f.name)
          return {
            name: f.name,
            url: urlData.publicUrl,
            type: VIDEO_EXTS.includes(ext) ? 'video' : 'image',
          }
        })

      // Shuffle so images and videos mix on every load
      for (let i = mediaFiles.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[mediaFiles[i], mediaFiles[j]] = [mediaFiles[j], mediaFiles[i]]
      }

      setItems(mediaFiles)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function openLightbox(item) {
    setLightboxItem(item)
    document.body.style.overflow = 'hidden'
  }

  function closeLightbox() {
    setLightboxItem(null)
    document.body.style.overflow = ''
  }

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') closeLightbox()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  return (
    <>
      {/* Loading screen */}
      {loading && (
        <div className="loading-screen">
          <div className="spinner" />
          <p className="loading-label">Loading</p>
        </div>
      )}

      <header className="gallery-header">
        <Link href="/" className="logo">
          Vis<em>ora</em>
        </Link>
        <Link href="/" className="back-btn">
          ← Back
        </Link>
      </header>

      <div className={`gallery-wrap ${!loading ? 'visible' : ''}`}>
        {error ? (
          <div className="state-container">
            <p className="state-title">Couldn't load media</p>
            <p className="state-sub">{error}</p>
          </div>
        ) : items.length === 0 && !loading ? (
          <div className="state-container">
            <p className="state-title">No media yet</p>
            <p className="state-sub">Upload images or videos to the gallery bucket in Supabase Storage.</p>
          </div>
        ) : (
          <div className="gallery-grid">
            {items.map((item, idx) => (
              <GalleryItem
                key={item.name}
                item={item}
                idx={idx}
                onClick={() => openLightbox(item)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxItem && (
        <div className="lightbox" onClick={e => { if (e.target === e.currentTarget) closeLightbox() }}>
          <button className="lightbox-close" onClick={closeLightbox}>✕ Close</button>
          <div className="lightbox-inner">
            {lightboxItem.type === 'video' ? (
              <video src={lightboxItem.url} controls autoPlay loop />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={lightboxItem.url} alt="" />
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        .loading-screen {
          position: fixed;
          inset: 0;
          z-index: 150;
          background: var(--black);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          gap: 1.25rem;
        }

        .loading-label {
          font-size: 0.6rem;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: var(--warm-grey);
        }

        .gallery-header {
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

        .back-btn {
          font-size: 0.65rem;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: var(--warm-grey);
          text-decoration: none;
          transition: color 0.2s;
        }

        .back-btn:hover {
          color: var(--accent);
        }

        .gallery-wrap {
          padding: 1.5rem;
          opacity: 0;
          transition: opacity 0.8s ease;
        }

        .gallery-wrap.visible {
          opacity: 1;
        }

        .gallery-grid {
          columns: 3;
          column-gap: 1rem;
        }

        @media (max-width: 900px) { .gallery-grid { columns: 2; } }
        @media (max-width: 500px) { .gallery-grid { columns: 1; } }

        .state-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 6rem 2rem;
          text-align: center;
          gap: 1rem;
        }

        .state-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.5rem;
          font-weight: 300;
        }

        .state-sub {
          font-size: 0.65rem;
          letter-spacing: 0.1em;
          color: var(--warm-grey);
          max-width: 320px;
          line-height: 1.8;
          text-transform: uppercase;
        }

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

        .lightbox-inner img,
        .lightbox-inner video {
          max-width: 90vw;
          max-height: 88vh;
          object-fit: contain;
          display: block;
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

// Separate component so we can attach the IntersectionObserver per item
function GalleryItem({ item, idx, onClick }) {
  const videoRef = useRef(null)

  useEffect(() => {
    if (item.type !== 'video' || !videoRef.current) return

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            videoRef.current?.play().catch(() => {})
          } else {
            videoRef.current?.pause()
          }
        })
      },
      { threshold: 0.25 }
    )

    observer.observe(videoRef.current)
    return () => observer.disconnect()
  }, [item.type])

  return (
    <>
      <div
        className="gallery-item"
        style={{ animationDelay: `${idx * 55}ms` }}
        onClick={onClick}
      >
        {item.type === 'video' ? (
          <video
            ref={videoRef}
            src={item.url}
            muted
            loop
            playsInline
            preload="metadata"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.url} alt="" loading="lazy" />
        )}
      </div>

      <style jsx>{`
        .gallery-item {
          break-inside: avoid;
          margin-bottom: 1rem;
          position: relative;
          overflow: hidden;
          background: #111;
          cursor: pointer;
          opacity: 0;
          transform: translateY(12px);
          animation: itemIn 0.5s ease forwards;
        }

        @keyframes itemIn {
          to { opacity: 1; transform: translateY(0); }
        }

        .gallery-item img,
        .gallery-item video {
          display: block;
          width: 100%;
          height: auto;
        }
      `}</style>
    </>
  )
}
