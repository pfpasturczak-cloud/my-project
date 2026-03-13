'use client'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '../../../../lib/supabase/server'
import Header from '../../../../components/Header'
import AdminJobControls from './AdminJobControls'

export default async function AdminJobPage({ params }) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/dashboard')

  const { data: project } = await supabase
    .from('projects')
    .select(`
      *,
      profiles:client_id ( full_name, email )
    `)
    .eq('id', params.id)
    .single()

  if (!project) notFound()

  const { data: assets } = await supabase
    .from('assets')
    .select('*')
    .eq('project_id', project.id)
    .order('created_at', { ascending: true })

  const referenceAssets = assets?.filter(a => a.type === 'reference') || []
  const deliverableAssets = assets?.filter(a => a.type === 'deliverable') || []

  // Signed URLs for reference uploads
  const referenceUrls = await Promise.all(
    referenceAssets.map(async asset => {
      const { data } = await supabase.storage
        .from('reference-uploads')
        .createSignedUrl(asset.storage_path, 3600)
      return { ...asset, signedUrl: data?.signedUrl }
    })
  )

  // Signed URLs for deliverables
  const deliverableUrls = await Promise.all(
    deliverableAssets.map(async asset => {
      const { data } = await supabase.storage
        .from('deliverables')
        .createSignedUrl(asset.storage_path, 3600)
      return { ...asset, signedUrl: data?.signedUrl }
    })
  )

  return (
    <>
      <Header role="admin" />

      <main className="main">
        <div className="page-header">
          <Link href="/admin" className="back-link">← Job queue</Link>
          <div className="title-row">
            <h1 className="page-title">{project.name}</h1>
            <span className={`status-pill status-${project.status}`}>{project.status.replace('_', ' ')}</span>
          </div>
          <p className="client-info">
            Client: {project.profiles?.full_name} — {project.profiles?.email}
          </p>
          <p className="project-date">
            Submitted {new Date(project.created_at).toLocaleDateString('en-GB', {
              day: 'numeric', month: 'long', year: 'numeric'
            })}
          </p>
        </div>

        {/* Brief */}
        <section className="section">
          <p className="section-label">Brief</p>
          <div className="brief-box">
            {project.brief ? (
              <p className="brief-text">{project.brief}</p>
            ) : (
              <p className="brief-empty">No brief provided.</p>
            )}
          </div>
        </section>

        {/* Reference images */}
        {referenceUrls.length > 0 && (
          <section className="section">
            <p className="section-label">Reference images ({referenceUrls.length})</p>
            <div className="asset-grid">
              {referenceUrls.map(asset => (
                <a key={asset.id} href={asset.signedUrl} target="_blank" rel="noopener noreferrer" className="asset-thumb">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={asset.signedUrl} alt={asset.file_name} loading="lazy" />
                  <p className="asset-name">{asset.file_name}</p>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* Admin controls — status update + deliverable upload */}
        <AdminJobControls
          project={project}
          deliverables={deliverableUrls}
          clientEmail={project.profiles?.email}
          clientName={project.profiles?.full_name}
        />
      </main>

      <style jsx>{`
        .main {
          max-width: 900px;
          margin: 0 auto;
          padding: 3rem 2rem;
        }

        .page-header {
          margin-bottom: 3rem;
        }

        .back-link {
          font-size: 0.6rem;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: var(--warm-grey);
          text-decoration: none;
          transition: color 0.2s;
          display: inline-block;
          margin-bottom: 1rem;
        }

        .back-link:hover { color: var(--accent); }

        .title-row {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .page-title {
          font-family: 'Cormorant Garamond', serif;
          font-weight: 300;
          font-size: 2.5rem;
          line-height: 1.1;
        }

        .client-info {
          font-size: 0.65rem;
          letter-spacing: 0.1em;
          color: var(--accent);
          margin-top: 0.75rem;
          text-transform: uppercase;
        }

        .project-date {
          font-size: 0.6rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--warm-grey);
          margin-top: 0.3rem;
        }

        .section {
          margin-bottom: 2.5rem;
          padding-bottom: 2.5rem;
          border-bottom: 1px solid var(--border);
        }

        .section-label {
          font-size: 0.6rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--warm-grey);
          margin-bottom: 1.25rem;
        }

        .brief-box {
          padding: 1.5rem;
          border: 1px solid var(--border);
          background: rgba(240, 237, 232, 0.02);
        }

        .brief-text {
          font-size: 0.8rem;
          line-height: 1.75;
          color: var(--off-white);
          white-space: pre-wrap;
        }

        .brief-empty {
          font-size: 0.7rem;
          color: var(--warm-grey);
          letter-spacing: 0.1em;
        }

        .asset-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
          gap: 0.75rem;
        }

        .asset-thumb {
          border: 1px solid var(--border);
          overflow: hidden;
          text-decoration: none;
          display: block;
          transition: border-color 0.2s;
        }

        .asset-thumb:hover { border-color: var(--accent); }

        .asset-thumb img {
          display: block;
          width: 100%;
          height: 120px;
          object-fit: cover;
        }

        .asset-name {
          padding: 0.4rem 0.5rem;
          font-size: 0.55rem;
          letter-spacing: 0.05em;
          color: var(--warm-grey);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      `}</style>
    </>
  )
}
