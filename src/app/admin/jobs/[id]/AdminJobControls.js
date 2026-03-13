'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../../../lib/supabase/client'

const STATUS_OPTIONS = [
  { value: 'submitted', label: 'Submitted' },
  { value: 'in_review', label: 'In Review' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'ready', label: 'Ready to View' },
  { value: 'complete', label: 'Complete' },
]

export default function AdminJobControls({ project, deliverables, clientEmail, clientName }) {
  const router = useRouter()
  const [status, setStatus] = useState(project.status)
  const [statusLoading, setStatusLoading] = useState(false)
  const [statusMsg, setStatusMsg] = useState('')
  const [files, setFiles] = useState([])
  const [uploadLoading, setUploadLoading] = useState(false)
  const [uploadMsg, setUploadMsg] = useState('')
  const [uploadError, setUploadError] = useState('')
  const fileInputRef = useRef(null)

  async function handleStatusUpdate() {
    if (status === project.status) return
    setStatusLoading(true)
    setStatusMsg('')

    const supabase = createClient()
    const { error } = await supabase
      .from('projects')
      .update({ status })
      .eq('id', project.id)

    if (error) {
      setStatusMsg(`Error: ${error.message}`)
      setStatusLoading(false)
      return
    }

    // If marking as ready — trigger email notification
    if (status === 'ready') {
      try {
        await fetch('/api/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientEmail,
            clientName,
            projectName: project.name,
            projectId: project.id,
          }),
        })
        setStatusMsg('Status updated. Email sent to client.')
      } catch {
        setStatusMsg('Status updated. Email notification failed — check logs.')
      }
    } else {
      setStatusMsg('Status updated.')
    }

    setStatusLoading(false)
    router.refresh()
  }

  function handleFileChange(e) {
    const selected = Array.from(e.target.files)
    setFiles(prev => [...prev, ...selected])
  }

  function removeFile(index) {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  async function handleUpload() {
    if (files.length === 0) return
    setUploadLoading(true)
    setUploadError('')
    setUploadMsg('')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    for (const file of files) {
      const filePath = `${project.id}/${Date.now()}-${file.name}`
      const { error: uploadError } = await supabase.storage
        .from('deliverables')
        .upload(filePath, file)

      if (uploadError) {
        setUploadError(`Upload failed for ${file.name}: ${uploadError.message}`)
        setUploadLoading(false)
        return
      }

      await supabase.from('assets').insert({
        project_id: project.id,
        type: 'deliverable',
        file_name: file.name,
        storage_path: filePath,
        uploaded_by: user.id,
      })
    }

    setFiles([])
    setUploadMsg(`${files.length} file${files.length > 1 ? 's' : ''} uploaded.`)
    setUploadLoading(false)
    router.refresh()
  }

  return (
    <>
      {/* Status control */}
      <section className="section">
        <p className="section-label">Update status</p>
        <div className="status-row">
          <select
            className="input status-select"
            value={status}
            onChange={e => setStatus(e.target.value)}
          >
            {STATUS_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <button
            className="btn-primary update-btn"
            onClick={handleStatusUpdate}
            disabled={statusLoading || status === project.status}
          >
            <span>{statusLoading ? 'Updating...' : 'Update'}</span>
            {!statusLoading && <span>→</span>}
          </button>
        </div>
        {statusMsg && (
          <p className={statusMsg.startsWith('Error') ? 'error-msg' : 'success-msg'}>{statusMsg}</p>
        )}
        <p className="status-note">
          Setting to <strong>Ready to View</strong> will automatically email the client.
        </p>
      </section>

      {/* Deliverables */}
      <section className="section">
        <p className="section-label">
          Deliverables {deliverables.length > 0 ? `(${deliverables.length} uploaded)` : ''}
        </p>

        {deliverables.length > 0 && (
          <div className="deliverable-grid">
            {deliverables.map(asset => (
              <a key={asset.id} href={asset.signedUrl} target="_blank" rel="noopener noreferrer" className="asset-thumb">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={asset.signedUrl} alt={asset.file_name} loading="lazy" />
                <p className="asset-name">{asset.file_name}</p>
              </a>
            ))}
          </div>
        )}

        <div
          className="upload-area"
          onClick={() => fileInputRef.current?.click()}
        >
          <p className="upload-icon">↑</p>
          <p className="upload-text">Upload deliverables</p>
          <p className="upload-sub">Finished AI-generated images or video</p>
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
            <button
              className="btn-primary"
              onClick={handleUpload}
              disabled={uploadLoading}
            >
              <span>{uploadLoading ? 'Uploading...' : `Upload ${files.length} file${files.length > 1 ? 's' : ''}`}</span>
              {!uploadLoading && <span>↑</span>}
            </button>
          </div>
        )}

        {uploadMsg && <p className="success-msg">{uploadMsg}</p>}
        {uploadError && <p className="error-msg">{uploadError}</p>}
      </section>

      <style jsx>{`
        .section {
          margin-bottom: 2.5rem;
          padding-bottom: 2.5rem;
          border-bottom: 1px solid var(--border);
        }

        .section:last-child { border-bottom: none; }

        .section-label {
          font-size: 0.6rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--warm-grey);
          margin-bottom: 1.25rem;
        }

        .status-row {
          display: flex;
          gap: 0.75rem;
          align-items: stretch;
        }

        .status-select {
          flex: 1;
          appearance: none;
          -webkit-appearance: none;
          cursor: pointer;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23a09890' stroke-width='1.5' fill='none'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 1rem center;
          padding-right: 2.5rem;
        }

        .update-btn {
          min-width: 120px;
          white-space: nowrap;
        }

        .status-note {
          font-size: 0.6rem;
          letter-spacing: 0.08em;
          color: var(--warm-grey);
          margin-top: 0.75rem;
          line-height: 1.6;
        }

        .status-note strong {
          color: var(--accent);
          font-weight: 400;
        }

        .success-msg {
          font-size: 0.65rem;
          letter-spacing: 0.1em;
          color: #a8e6cf;
          margin-top: 0.5rem;
        }

        .deliverable-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
          gap: 0.75rem;
          margin-bottom: 1.25rem;
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
          margin-bottom: 1rem;
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

        .file-remove:hover { color: #ff6b6b; }
      `}</style>
    </>
  )
}
