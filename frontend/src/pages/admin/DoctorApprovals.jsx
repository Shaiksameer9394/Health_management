// src/pages/admin/DoctorApprovals.jsx
import { useState, useEffect } from 'react'
import { adminAPI } from '../../services/api'
import { Button } from '../../components/common/UI'
import { ShieldCheck, CheckCircle, XCircle, Stethoscope, Clock, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminDoctorApprovals() {
  const [pending, setPending] = useState([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState({})

  const load = () => {
    adminAPI.getPendingDoctors()
      .then(res => setPending(res.data.data || res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const approve = async (id) => {
    setProcessing(p => ({ ...p, [id]:'approving' }))
    try {
      await adminAPI.approveDoctor(id)
      toast.success('Doctor approved! They can now log in.')
      load()
    } catch {}
    finally { setProcessing(p => ({ ...p, [id]:null })) }
  }

  const reject = async (id) => {
    if (!window.confirm('Reject this doctor application?')) return
    setProcessing(p => ({ ...p, [id]:'rejecting' }))
    try {
      await adminAPI.rejectDoctor(id)
      toast.success('Application rejected')
      load()
    } catch {}
    finally { setProcessing(p => ({ ...p, [id]:null })) }
  }

  return (
    <div className="animate-fade" style={{ display:'flex', flexDirection:'column', gap:24 }}>
      <div>
        <h1 style={{ fontFamily:'var(--font-display)', fontSize:'1.5rem', fontWeight:700, marginBottom:4 }}>Doctor Approvals</h1>
        <p style={{ color:'var(--text-secondary)', fontSize:'0.875rem' }}>Review and approve doctor registration applications</p>
      </div>

      {/* Info Banner */}
      <div style={{ padding:16, background:'rgba(66,165,245,0.06)', border:'1px solid rgba(66,165,245,0.15)', borderRadius:'var(--radius-md)', display:'flex', alignItems:'center', gap:12, fontSize:'0.85rem', color:'var(--text-secondary)' }}>
        <AlertCircle size={16} color="var(--teal-400)" style={{ flexShrink:0 }} />
        Doctor accounts require manual verification before platform access is granted. Please verify credentials before approving.
      </div>

      {loading ? (
        <p style={{ color:'var(--text-muted)', textAlign:'center', padding:40 }}>Loading applications…</p>
      ) : pending.length === 0 ? (
        <div className="card" style={{ padding:60, textAlign:'center' }}>
          <CheckCircle size={48} color="var(--green-400)" style={{ opacity:0.3, marginBottom:16 }} />
          <h3 style={{ fontFamily:'var(--font-display)', fontWeight:600, marginBottom:8, color:'var(--text-secondary)' }}>All caught up!</h3>
          <p style={{ color:'var(--text-muted)', fontSize:'0.875rem' }}>No pending doctor applications at this time</p>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:'0.85rem', color:'var(--text-secondary)' }}>
            <Clock size={14} color="var(--amber-400)" />
            <span><strong style={{ color:'var(--amber-400)' }}>{pending.length}</strong> application{pending.length!==1?'s':''} awaiting review</span>
          </div>
          {pending.map((doc, i) => (
            <div key={i} className="card" style={{ padding:24 }}>
              <div style={{ display:'flex', alignItems:'flex-start', gap:16, flexWrap:'wrap' }}>
                <div style={{ width:52, height:52, borderRadius:'50%', background:'linear-gradient(135deg,var(--teal-700),var(--jade-600))', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-display)', fontWeight:700, fontSize:'1.1rem', flexShrink:0 }}>
                  {doc.firstName?.[0]}{doc.lastName?.[0]}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
                    <h3 style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:'1.05rem' }}>Dr. {doc.firstName} {doc.lastName}</h3>
                    <span className="badge badge-warning"><Clock size={9} /> Pending</span>
                  </div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:'6px 20px', fontSize:'0.82rem', color:'var(--text-secondary)', marginBottom:16 }}>
                    <span>📧 {doc.email}</span>
                    {doc.phone && <span>📞 {doc.phone}</span>}
                    {doc.specialization && <span style={{ display:'flex', alignItems:'center', gap:4 }}><Stethoscope size={12} /> {doc.specialization}</span>}
                    {doc.licenseNumber && <span>🪪 License: {doc.licenseNumber}</span>}
                    <span>📅 Applied: {new Date(doc.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })}</span>
                  </div>

                  {/* Details grid */}
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:12, padding:16, background:'var(--bg-card-hover)', borderRadius:'var(--radius-md)', border:'1px solid var(--border)', marginBottom:16 }}>
                    <div>
                      <div style={{ fontSize:'0.72rem', color:'var(--text-muted)', marginBottom:2, textTransform:'uppercase', letterSpacing:'0.05em' }}>Specialization</div>
                      <div style={{ fontWeight:600, fontSize:'0.875rem' }}>{doc.specialization || '—'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize:'0.72rem', color:'var(--text-muted)', marginBottom:2, textTransform:'uppercase', letterSpacing:'0.05em' }}>License No.</div>
                      <div style={{ fontWeight:600, fontSize:'0.875rem', fontFamily:'var(--font-mono)' }}>{doc.licenseNumber || '—'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize:'0.72rem', color:'var(--text-muted)', marginBottom:2, textTransform:'uppercase', letterSpacing:'0.05em' }}>Experience</div>
                      <div style={{ fontWeight:600, fontSize:'0.875rem' }}>{doc.experience ? `${doc.experience} years` : '—'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize:'0.72rem', color:'var(--text-muted)', marginBottom:2, textTransform:'uppercase', letterSpacing:'0.05em' }}>Qualification</div>
                      <div style={{ fontWeight:600, fontSize:'0.875rem' }}>{doc.qualification || '—'}</div>
                    </div>
                  </div>

                  <div style={{ display:'flex', gap:12 }}>
                    <button onClick={() => approve(doc._id)} disabled={!!processing[doc._id]}
                      style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 20px', borderRadius:'var(--radius-md)', background: processing[doc._id]==='approving' ? 'rgba(67,160,71,0.5)' : 'linear-gradient(135deg,var(--green-600),var(--green-500))', border:'none', color:'white', fontWeight:600, fontSize:'0.875rem', cursor: processing[doc._id] ? 'not-allowed' : 'pointer', transition:'all var(--transition)' }}>
                      <CheckCircle size={15} /> {processing[doc._id]==='approving' ? 'Approving…' : 'Approve Doctor'}
                    </button>
                    <button onClick={() => reject(doc._id)} disabled={!!processing[doc._id]}
                      style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 20px', borderRadius:'var(--radius-md)', background:'rgba(229,57,53,0.1)', border:'1px solid rgba(229,57,53,0.25)', color:'var(--rose-400)', fontWeight:600, fontSize:'0.875rem', cursor: processing[doc._id] ? 'not-allowed' : 'pointer', transition:'all var(--transition)' }}>
                      <XCircle size={15} /> {processing[doc._id]==='rejecting' ? 'Rejecting…' : 'Reject'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
