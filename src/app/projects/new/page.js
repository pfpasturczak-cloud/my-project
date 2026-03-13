'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '../../lib/supabase/client'
import Header from '../../../components/Header'

export default function NewProjectPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [brief, setBrief] = useState('')
  const [files, setFiles] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')
  const fileInputRef = useRef(null)

  function handleFileChange(e) {
    const selected = Array.from(e.target.files)
    setFiles(prev => [...prev, ...selected])
  }

  function removeFile(index) {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('Not authenticated. Please log in again.')
      setLoading(false)
      return
    }

    // 1. Create the project record
    setUploadProgress('Creating project...')
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({ client_id: user.id, name, brief, status: 'submitted' })
      .select()
      .single()

    if (projectError) {
      setError(projectError.message)
      setLoading(false)
      return
    }

    // 2. Upload reference images to Supabase Storage
    if (files.length > 0) {
      setUploadProgress(`Uploading ${files.length} file${files.length > 1 ? 's' : ''}...`)

      for (const file of files) {
        const filePath = `${project.id}/${Date.now()}-${file.name}`
        const { error: uploadError } = await supabase.storage
          .from('reference-uploads')
          .upload(filePath, file)

        if (uploadError) {
          setError(`Upload failed for ${file.name}: ${uploadError.message}`)
          setLoading(false)
          return
        }

        // 3. Insert asset record
        await supabase.from('assets').insert({
          project_id: project.id,
          type: 'reference',
          file_name: file.name,
          storage_path: filePath,
          uploaded_by: user.id,
        })
      }
    }

    router.push(`/projects/${project.id}`)
  }

  return (
    <>
      <Header />

      <main className="main">
        <div className="page-header">
          <Link href="/dashboard" className="back-link">← Dashboard</Link>
          <h1 className="page-title">New project</h1>
        </div>

        <form onSubmit={handleSubmit} className="project-form">
          {/* Project name */}
          <div className="field">
            <label className="label">Project name</label>
            <input
              className="input"
              type="text"
              placeholder="e.g. Riverside Apartments — Phase 2"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>

          {/* Brief */}
          <div className="field">
            <label className="label">Brief</label>
            <textarea
              className="input"
              placeholder="Describe what you need. Include details about the property, the type of media required, any style preferences, and what you'll use this for..."
              value={brief}
              onChange={e => setBrief(e.target.value)}
              rows={6}
            />
          </div>

          {/* Reference images */}
          <div className="field">
            <label className="label">Reference images <span className="optional">(optional)</span></label>
            <div
              className="upload-area"
              onClick={() => fileInputRef.current?.click()}
            >
              <p className="upload-icon">↑</p>
              <p className="upload-text">Click to upload images</p>
              <p className="upload-sub">JPG, PNG, WEBP, MP4 accepted</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </div>

            {files.length > 0 && (
              <div className="file-list">
                {files.map((file, i) => (
                  <div key={i} className="file-item">
                    <span className="file-name">{file.name}</span>
                    <span className="file-size">{(file.size / 1024 / 1024).toFixed(1)}mb</span>
                    <button type="button" className="file-remove" onClick={() => removeFile(i)}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && <p className="error-msg">{error}</p>}

          {loading && uploadProgress && (
            <p className="progress-msg">{uploadProgress}</p>
          )}

          <div className="form-actions">
            <Link href="/dashboard" className="btn-ghost cancel-btn">
              Cancel
            </Link>
            <button className="btn-primary submit-btn" type="submit" disabled={loading}>
              <span>{loading ? 'Submitting...' : 'Submit project'}</span>
              {!loading && <span>→</span>}
            </button>
          </div>
        </form>
      </main>

      <style jsx>{`
        .main {
          max-width: 680px;
          margin: 0 auto;
          padding: 3rem 2rem;
        }

        .page-header {
          margin-bottom: 2.5rem;
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

        .back-link:hover {
          color: var(--accent);
        }

        .page-title {
          font-family: 'Cormorant Garamond', serif;
          font-weight: 300;
          font-size: 2.5rem;
          line-height: 1;
        }

        .project-form {
          display: flex;
          flex-direction: column;
          gap: 1.75rem;
        }

        .field {
          display: flex;
          flex-direction: column;
        }

        .optional {
          color: var(--warm-grey);
          text-transform: lowercase;
          letter-spacing: 0;
        }

        .upload-area {
          border: 1px dashed var(--border-subtle);
          padding: 2.5rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          cursor: pointer;
          transition: all 0.2s;
          text-align: center;
        }

        .upload-area:hover {
          border-color: var(--accent);
          background: var(--accent-dim);
        }

        .upload-icon {
          font-size: 1.5rem;
          color: var(--warm-grey);
        }

        .upload-text {
          font-size: 0.7rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--off-white);
        }

        .upload-sub {
          font-size: 0.6rem;
          letter-spacing: 0.1em;
          color: var(--warm-grey);
          text-transform: uppercase;
        }

        .file-list {
          margin-top: 0.75rem;
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }

        .file-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.6rem 0.75rem;
          border: 1px solid var(--border);
          background: rgba(240, 237, 232, 0.02);
        }

        .file-name {
          flex: 1;
          font-size: 0.65rem;
          letter-spacing: 0.05em;
          color: var(--off-white);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .file-size {
          font-size: 0.6rem;
          color: var(--warm-grey);
          white-space: nowrap;
        }

        .file-remove {
          background: none;
          border: none;
          color: var(--warm-grey);
          cursor: pointer;
          font-size: 0.65rem;
          padding: 0;
          font-family: 'Geist Mono', monospace;
          transition: color 0.2s;
        }

        .file-remove:hover {
          color: #ff6b6b;
        }

        .progress-msg {
          font-size: 0.65rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--accent);
        }

        .form-actions {
          display: flex;
          gap: 0.75rem;
          padding-top: 0.5rem;
        }

        .cancel-btn {
          max-width: 140px;
          justify-content: center;
        }

        .submit-btn {
          flex: 1;
        }
      `}</style>
    </>
  )
}
