'use client'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '../../../lib/supabase/server'
import Header from '../../../components/Header'
import DeliverableSection from './DeliverableSection'

const STATUS_LABELS = {
  submitted: 'Submitted',
  in_review: 'In Review',
  in_progress: 'In Progress',
  ready: 'Ready to View',
  complete: 'Complete',
}

const STATUS_STEPS = ['submitted', 'in_review', 'in_progress', 'ready', 'complete']

export default async function ProjectPage({ params }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!project) notFound()

  // Clients can only see their own projects
  if (profile?.role !== 'admin' && project.client_id !== user.id) {
    redirect('/dashboard')
  }

  const { data: assets } = await supabase
    .from('assets')
    .select('*')
    .eq('project_id', project.id)
    .order('created_at', { ascending: true })

  const referenceAssets = assets?.filter(a => a.type === 'reference') || []
  const deliverableAssets = assets?.filter(a => a.type === 'deliverable') || []

  // Generate signed URLs for reference assets (private bucket)
  const referenceUrls = await Promise.all(
    referenceAssets.map(async asset => {
      const { data } = await supabase.storage
        .from('reference-uploads')
        .createSignedUrl(asset.storage_path, 3600)
      return { ...asset, signedUrl: data?.signedUrl }
    })
  )

  // Generate signed URLs for deliverables (private bucket)
  const deliverableUrls = await Promise.all(
    deliverableAssets.map(async asset => {
      const { data } = await supabase.storage
        .from('deliverables')
        .createSignedUrl(asset.storage_path, 3600)
      return { ...asset, signedUrl: data?.signedUrl }
    })
  )

  const currentStep = STATUS_STEPS.indexOf(project.status)

  return (
    <>
      <Header role={profile?.role} />

      <main className="main">
        <div className="page-header">
          <Link href={profile?.role === 'admin' ? '/admin' : '/dashboard'} className="back-link">
            ← {profile?.role === 'admin' ? 'Job queue' : 'Dashboard'}
          </Link>
          <div className="title-row">
            <h1 className="page-title">{project.name}</h1>
            <span className={`status-pill status-${project.status}`}>
              {STATUS_LABELS[project.status]}
            </span>
          </div>
          <p className="project-date">
            Submitted {new Date(project.created_at).toLocaleDateString('en-GB', {
              day: 'numeric', month: 'long', year: 'numeric'
            })}
          </p>
        </div>

        {/* Status timeline */}
        <section className="section">
          <p className="section-label">Status</p>
          <div className="timeline">
            {STATUS_STEPS.map((step, i) => (
              <div key={step} className={`timeline-step ${i <= currentStep ? 'active' : ''} ${i === currentStep ? 'current' : ''}`}>
                <div className="step-dot" />
                <p className="step-label">{STATUS_LABELS[step]}</p>
                {i < STATUS_STEPS.length - 1 && <div className="step-line" />}
              </div>
            ))}
          </div>
        </section>

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
                <div key={asset.id} className="asset-thumb">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={asset.signedUrl} alt={asset.file_name} loading="lazy" />
                  <p className="asset-name">{asset.file_name}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Delivered content */}
        <section className="section">
          <p className="section-label">Delivered content</p>
          <DeliverableSection
            project={project}
            deliverables={deliverableUrls}
            isAdmin={profile?.role === 'admin'}
          />
        </section>
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

        .project-date {
          font-size: 0.6rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--warm-grey);
          margin-top: 0.75rem;
        }

        .section {
          margin-bottom: 2.5rem;
          padding-bottom: 2.5rem;
          border-bottom: 1px solid var(--border);
        }

        .section:last-child {
          border-bottom: none;
        }

        .section-label {
          font-size: 0.6rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--warm-grey);
          margin-bottom: 1.25rem;
        }

        /* Timeline */
        .timeline {
          display: flex;
          align-items: flex-start;
          gap: 0;
        }

        .timeline-step {
          display: flex;
          flex-direction: column;
          align-items: center;
          flex: 1;
          position: relative;
        }

        .step-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          border: 1px solid var(--border-subtle);
          background: var(--black);
          z-index: 1;
        }

        .timeline-step.active .step-dot {
          border-color: var(--warm-grey);
          background: var(--warm-grey);
        }

        .timeline-step.current .step-dot {
          border-color: var(--accent);
          background: var(--accent);
        }

        .step-label {
          font-size: 0.55rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--border-subtle);
          margin-top: 0.5rem;
          text-align: center;
        }

        .timeline-step.active .step-label { color: var(--warm-grey); }
        .timeline-step.current .step-label { color: var(--accent); }

        .step-line {
          position: absolute;
          top: 4px;
          left: 50%;
          width: 100%;
          height: 1px;
          background: var(--border);
          z-index: 0;
        }

        .timeline-step.active .step-line {
          background: var(--warm-grey);
        }

        /* Brief */
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

        /* Assets grid */
        .asset-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
          gap: 0.75rem;
        }

        .asset-thumb {
          border: 1px solid var(--border);
          overflow: hidden;
        }

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
