// src/pages/patient/Reports.jsx
import { useState, useEffect } from 'react'
import { reportAPI, patientAPI } from '../../services/api'
import { Button } from '../../components/common/UI'
import { FileText, Upload, Trash2, Share2, Eye, X } from 'lucide-react'
import toast from 'react-hot-toast'

const CATEGORIES = [
  { value: 'lab_result', label: 'Lab Result' },
  { value: 'radiology', label: 'Radiology' },
  { value: 'ecg', label: 'ECG' },
  { value: 'prescription', label: 'Prescription' },
  { value: 'discharge_summary', label: 'Discharge Summary' },
  { value: 'vaccination', label: 'Vaccination' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'consultation', label: 'Consultation' },
  { value: 'surgery', label: 'Surgery' },
  { value: 'other', label: 'Other' },
]

export default function ReportsPage() {
  const [reports, setReports] = useState([])
  const [doctors, setDoctors] = useState([])
  const [uploading, setUploading] = useState(false)
  const [shareModal, setShareModal] = useState(null)
  const [selectedDoc, setSelectedDoc] = useState('')
  const [uploadCategory, setUploadCategory] = useState('other')

  const load = async () => {
    const [rRes, dRes] = await Promise.allSettled([reportAPI.getAll(), patientAPI.getDoctors()])
    if (rRes.status === 'fulfilled') setReports(rRes.value.data.data || rRes.value.data || [])
    if (dRes.status === 'fulfilled') setDoctors(dRes.value.data.data || dRes.value.data || [])
  }

  useEffect(() => { load() }, [])

  const handleUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) return toast.error('File must be under 10MB')
    const fd = new FormData()
    fd.append('report', file)
    fd.append('title', file.name.replace(/\.[^.]+$/, ''))
    fd.append('name', file.name.replace(/\.[^.]+$/, ''))
    fd.append('category', uploadCategory)
    setUploading(true)
    try {
      await reportAPI.upload(fd)
      toast.success('Report uploaded!')
      load()
    } catch (err) { toast.error(err?.response?.data?.message || 'Upload failed. Check file size and type.') }
    finally { setUploading(false); e.target.value = '' }
  }

  const deleteReport = async (id) => {
    if (!confirm('Delete this report?')) return
    try { await reportAPI.delete(id); toast.success('Report deleted'); load() }
    catch (err) { toast.error(err?.response?.data?.message || 'Could not delete report') }
  }

  const shareReport = async () => {
    if (!selectedDoc) return toast.error('Select a doctor')
    try {
      await reportAPI.share(shareModal._id, selectedDoc)
      toast.success('Report shared!')
      setShareModal(null); setSelectedDoc('')
      load()
    } catch (err) { toast.error(err?.response?.data?.message || 'Could not share report') }
  }

  const typeIcon = (type) => {
    if (type?.includes('pdf')) return '📄'
    if (type?.includes('image')) return '🖼️'
    if (type?.includes('word')) return '📝'
    return '📋'
  }

  const getViewUrl = (r) => {
    if (r.fileUrl) return r.fileUrl
    if (r.filename) return `/uploads/reports/${r.filename}`
    return '#'
  }

  return (
    <div className="animate-fade" style={{ display:'flex', flexDirection:'column', gap:24 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontFamily:'var(--font-display)', fontSize:'1.5rem', fontWeight:700, marginBottom:4 }}>Medical Reports</h1>
          <p style={{ color:'var(--text-secondary)', fontSize:'0.875rem' }}>Upload, manage and share your medical documents</p>
        </div>
        <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
          <select
            value={uploadCategory}
            onChange={e => setUploadCategory(e.target.value)}
            style={{ padding:'9px 14px', background:'var(--bg-secondary)', border:'1px solid var(--border)', borderRadius:'var(--radius-md)', color:'var(--text-primary)', fontSize:'0.875rem', fontFamily:'var(--font-body)' }}
          >
            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <label style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'9px 18px', borderRadius:'var(--radius-md)', background:'linear-gradient(135deg,var(--teal-600),var(--teal-500))', color:'white', fontWeight:600, fontSize:'0.875rem', cursor: uploading ? 'not-allowed' : 'pointer', opacity: uploading ? 0.7 : 1 }}>
            {uploading ? 'Uploading…' : <><Upload size={16} /> Upload Report</>}
            <input type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={handleUpload} style={{ display:'none' }} disabled={uploading} />
          </label>
        </div>
      </div>

      {reports.length === 0 ? (
        <div className="card" style={{ padding:60, textAlign:'center', color:'var(--text-muted)' }}>
          <FileText size={48} style={{ opacity:0.2, marginBottom:16 }} />
          <p style={{ fontSize:'1rem', fontFamily:'var(--font-display)', fontWeight:600, marginBottom:6, color:'var(--text-secondary)' }}>No reports yet</p>
          <p style={{ fontSize:'0.85rem' }}>Upload your lab results, prescriptions, or any medical documents</p>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:16 }}>
          {reports.map((r, i) => (
            <div key={r._id || i} className="card" style={{ padding:20 }}>
              <div style={{ display:'flex', alignItems:'flex-start', gap:14, marginBottom:16 }}>
                <div style={{ fontSize:'2rem', flexShrink:0 }}>{typeIcon(r.fileType)}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:600, fontSize:'0.9rem', marginBottom:3, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.title || r.name || r.fileName || 'Report'}</div>
                  <div style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>{new Date(r.createdAt).toLocaleDateString('en-IN')}</div>
                  {r.category && <div style={{ fontSize:'0.72rem', color:'var(--teal-400)', marginTop:2, textTransform:'capitalize' }}>{r.category.replace(/_/g,' ')}</div>}
                  {r.fileSize && <div style={{ fontSize:'0.72rem', color:'var(--text-muted)' }}>{(r.fileSize/1024).toFixed(0)} KB</div>}
                </div>
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <a href={getViewUrl(r)} target="_blank" rel="noopener noreferrer" style={{ flex:1 }}>
                  <Button variant="secondary" size="sm" fullWidth icon={<Eye size={12} />}>View</Button>
                </a>
                <Button variant="secondary" size="sm" icon={<Share2 size={12} />} onClick={() => { setShareModal(r); setSelectedDoc('') }}>Share</Button>
                <button onClick={() => deleteReport(r._id)} style={{ padding:'6px 10px', borderRadius:'var(--radius-sm)', background:'rgba(229,57,53,0.1)', border:'1px solid rgba(229,57,53,0.2)', color:'var(--rose-400)', cursor:'pointer' }}>
                  <Trash2 size={14} />
                </button>
              </div>
              {r.sharedWith?.length > 0 && (
                <div style={{ marginTop:10, fontSize:'0.72rem', color:'var(--text-muted)' }}>Shared with {r.sharedWith.length} doctor(s)</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Share modal */}
      {shareModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100, padding:24 }}>
          <div className="card" style={{ width:'100%', maxWidth:400, padding:28 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:20 }}>
              <h3 style={{ fontFamily:'var(--font-display)', fontWeight:600 }}>Share Report</h3>
              <button onClick={() => setShareModal(null)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)' }}><X size={18} /></button>
            </div>
            <p style={{ fontSize:'0.85rem', color:'var(--text-secondary)', marginBottom:16 }}>Share "<strong>{shareModal.title || shareModal.name}</strong>" with your doctor</p>
            {doctors.length === 0 ? (
              <p style={{ fontSize:'0.85rem', color:'var(--text-muted)', marginBottom:16 }}>No doctors available. Please assign a doctor from your profile first.</p>
            ) : (
              <select value={selectedDoc} onChange={e => setSelectedDoc(e.target.value)}
                style={{ width:'100%', padding:'10px 14px', background:'var(--bg-secondary)', border:'1px solid var(--border)', borderRadius:'var(--radius-md)', color:'var(--text-primary)', fontSize:'0.875rem', fontFamily:'var(--font-body)', marginBottom:16 }}>
                <option value="">Select a doctor</option>
                {doctors.map(d => <option key={d._id} value={d._id}>Dr. {d.firstName} {d.lastName} — {d.specialization || 'General'}</option>)}
              </select>
            )}
            <div style={{ display:'flex', gap:12 }}>
              <Button variant="secondary" fullWidth onClick={() => setShareModal(null)}>Cancel</Button>
              <Button fullWidth icon={<Share2 size={14} />} onClick={shareReport} disabled={!selectedDoc || doctors.length === 0}>Share</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
