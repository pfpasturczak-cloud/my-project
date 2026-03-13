'use client'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '../../lib/supabase/server'
import Header from '../../components/Header'

const STATUS_LABELS = {
  submitted: 'Submitted',
  in_review: 'In Review',
  in_progress: 'In Progress',
  ready: 'Ready to View',
  complete: 'Complete',
}

const STATUS_ORDER = ['submitted', 'in_review', 'in_progress', 'ready', 'complete']

export default async function AdminDashboard() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/dashboard')

  const { data: projects } = await supabase
    .from('projects')
    .select(`
      id, name, status, created_at, brief,
      profiles:client_id ( full_name, email )
    `)
    .order('created_at', { ascending: false })

  // Group by status for easy scanning
  const byStatus = STATUS_ORDER.reduce((acc, s) => {
    acc[s] = (projects || []).filter(p => p.status === s)
    return acc
  }, {})

  const activeStatuses = STATUS_ORDER.filter(s => byStatus[s].length > 0)

  return (
    <>
      <Header role="admin" />

      <main className="main">
        <div className="page-header">
          <div>
            <h1 className="page-title">Job queue</h1>
            <p className="page-sub">{projects?.length || 0} total projects</p>
          </div>
        </div>

        {projects?.length === 0 ? (
          <div className="empty-state">
            <p className="empty-title">No jobs yet</p>
            <p className="empty-sub">Projects submitted by clients will appear here</p>
          </div>
        ) : (
          activeStatuses.map(status => (
            <div key={status} className="status-group">
              <div className="group-header">
                <span className={`status-pill status-${status}`}>{STATUS_LABELS[status]}</span>
                <span className="group-count">{byStatus[status].length}</span>
              </div>
              <div className="job-list">
                {byStatus[status].map(project => (
                  <Link key={project.id} href={`/admin/jobs/${project.id}`} className="job-row">
                    <div className="job-main">
                      <p className="job-name">{project.name}</p>
                      <p className="job-client">
                        {project.profiles?.full_name || 'Unknown'} — {project.profiles?.email}
                      </p>
                    </div>
                    <div className="job-meta">
                      <p className="job-date">
                        {new Date(project.created_at).toLocaleDateString('en-GB', {
                          day: 'numeric', month: 'short'
                        })}
                      </p>
                      <span className="job-arrow">→</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))
        )}
      </main>

      <style jsx>{`
        .main {
          max-width: 900px;
          margin: 0 auto;
          padding: 3rem 2rem;
        }

        .page-header {
          margin-bottom: 2.5rem;
        }

        .page-title {
          font-family: 'Cormorant Garamond', serif;
          font-weight: 300;
          font-size: 2.5rem;
          line-height: 1;
        }

        .page-sub {
          font-size: 0.6rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--warm-grey);
          margin-top: 0.5rem;
        }

        .status-group {
          margin-bottom: 2.5rem;
        }

        .group-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.75rem;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid var(--border);
        }

        .group-count {
          font-size: 0.6rem;
          letter-spacing: 0.1em;
          color: var(--warm-grey);
        }

        .job-list {
          display: flex;
          flex-direction: column;
        }

        .job-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          padding: 1.1rem 1.25rem;
          border: 1px solid var(--border);
          border-top: none;
          text-decoration: none;
          transition: all 0.2s;
          background: rgba(240, 237, 232, 0.01);
        }

        .job-row:first-child {
          border-top: 1px solid var(--border);
        }

        .job-row:hover {
          background: var(--accent-dim);
          border-color: var(--accent);
        }

        .job-row:hover + .job-row {
          border-top-color: var(--accent);
        }

        .job-main {
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
          min-width: 0;
        }

        .job-name {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.1rem;
          font-weight: 300;
          color: var(--off-white);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .job-client {
          font-size: 0.6rem;
          letter-spacing: 0.08em;
          color: var(--warm-grey);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .job-meta {
          display: flex;
          align-items: center;
          gap: 1.25rem;
          flex-shrink: 0;
        }

        .job-date {
          font-size: 0.6rem;
          letter-spacing: 0.1em;
          color: var(--warm-grey);
        }

        .job-arrow {
          color: var(--warm-grey);
          font-size: 0.9rem;
          transition: all 0.2s;
        }

        .job-row:hover .job-arrow {
          color: var(--accent);
          transform: translateX(3px);
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 6rem 2rem;
          text-align: center;
          gap: 1rem;
          border: 1px solid var(--border);
        }

        .empty-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.75rem;
          font-weight: 300;
        }

        .empty-sub {
          font-size: 0.65rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--warm-grey);
        }
      `}</style>
    </>
  )
}
