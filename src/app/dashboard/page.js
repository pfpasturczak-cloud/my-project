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

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  // Admins shouldn't land here — send them to their panel
  if (profile?.role === 'admin') redirect('/admin')

  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, status, created_at')
    .eq('client_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <>
      <Header role={profile?.role} />

      <main className="main">
        <div className="page-header">
          <div>
            <h1 className="page-title">
              {profile?.full_name ? `Welcome, ${profile.full_name.split(' ')[0]}` : 'Dashboard'}
            </h1>
            <p className="page-sub">Your projects</p>
          </div>
          <Link href="/projects/new" className="new-btn">
            <span>New project</span>
            <span>+</span>
          </Link>
        </div>

        {projects && projects.length > 0 ? (
          <div className="project-grid">
            {projects.map(project => (
              <Link key={project.id} href={`/projects/${project.id}`} className="project-card">
                <div className="card-top">
                  <p className="project-name">{project.name}</p>
                  <span className={`status-pill status-${project.status}`}>
                    {STATUS_LABELS[project.status] || project.status}
                  </span>
                </div>
                <p className="project-date">
                  {new Date(project.created_at).toLocaleDateString('en-GB', {
                    day: 'numeric', month: 'short', year: 'numeric'
                  })}
                </p>
                <span className="card-arrow">→</span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p className="empty-title">No projects yet</p>
            <p className="empty-sub">Start by creating your first project</p>
            <Link href="/projects/new" className="btn-primary empty-btn">
              <span>Create project</span>
              <span>→</span>
            </Link>
          </div>
        )}
      </main>

      <style jsx>{`
        .main {
          max-width: 900px;
          margin: 0 auto;
          padding: 3rem 2rem;
        }

        .page-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          margin-bottom: 2.5rem;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .page-title {
          font-family: 'Cormorant Garamond', serif;
          font-weight: 300;
          font-size: 2.5rem;
          line-height: 1;
          color: var(--off-white);
        }

        .page-sub {
          font-size: 0.6rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--warm-grey);
          margin-top: 0.5rem;
        }

        .new-btn {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1.25rem;
          border: 1px solid var(--accent);
          color: var(--accent);
          background: var(--accent-dim);
          font-family: 'Geist Mono', monospace;
          font-size: 0.65rem;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          text-decoration: none;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .new-btn:hover {
          background: rgba(201, 169, 110, 0.25);
        }

        .project-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1rem;
        }

        .project-card {
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          padding: 1.5rem;
          border: 1px solid var(--border-subtle);
          background: rgba(240, 237, 232, 0.02);
          text-decoration: none;
          transition: all 0.25s ease;
          cursor: pointer;
        }

        .project-card:hover {
          border-color: var(--accent);
          background: var(--accent-dim);
        }

        .card-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 1rem;
        }

        .project-name {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.3rem;
          font-weight: 300;
          color: var(--off-white);
          line-height: 1.2;
        }

        .project-date {
          font-size: 0.6rem;
          letter-spacing: 0.1em;
          color: var(--warm-grey);
        }

        .card-arrow {
          position: absolute;
          bottom: 1.5rem;
          right: 1.5rem;
          font-size: 0.9rem;
          color: var(--warm-grey);
          transition: all 0.2s;
        }

        .project-card:hover .card-arrow {
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

        .empty-btn {
          margin-top: 1rem;
          max-width: 200px;
          justify-content: space-between;
        }
      `}</style>
    </>
  )
}
