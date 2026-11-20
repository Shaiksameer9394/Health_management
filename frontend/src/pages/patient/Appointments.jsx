// src/pages/patient/Appointments.jsx
import { useState, useEffect } from 'react'
import { appointmentAPI, patientAPI } from '../../services/api'
import { Button, Input } from '../../components/common/UI'
import {
  Calendar, Clock, User, Plus, X, CheckCircle, XCircle,
  AlertCircle, FileText, Pill, AlertTriangle, RefreshCw
} from 'lucide-react'
import toast from 'react-hot-toast'

const STATUS_BADGE = {
  confirmed: 'badge-success',
  pending:   'badge-warning',
  cancelled: 'badge-danger',
  completed: 'badge-neutral',
  no_show:   'badge-danger',
  rescheduled: 'badge-warning',
}
const STATUS_ICON = {
  confirmed: CheckCircle,
  pending:   AlertCircle,
  cancelled: XCircle,
  completed: CheckCircle,
  no_show:   AlertTriangle,
}

function PrescriptionModal({ prescription, onClose }) {
  if (!prescription) return null
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:20 }}>
      <div className="card" style={{ width:'100%', maxWidth:560, maxHeight:'85vh', overflowY:'auto', padding:28 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <div>
            <h2 style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:'1.15rem' }}>Prescription</h2>
            <p style={{ fontSize:'0.8rem', color:'var(--text-muted)', marginTop:2 }}>
              {prescription.prescriptionNumber} · {new Date(prescription.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })}
            </p>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', padding:4 }}><X size={20} /></button>
        </div>

        {/* Doctor */}
        <div style={{ padding:'10px 14px', background:'rgba(66,165,245,0.07)', borderRadius:'var(--radius-md)', marginBottom:16, fontSize:'0.85rem' }}>
          <span style={{ color:'var(--text-muted)' }}>Doctor: </span>
          <strong>Dr. {prescription.doctor?.firstName} {prescription.doctor?.lastName}</strong>
          {prescription.doctor?.specialization && <span style={{ color:'var(--text-muted)', marginLeft:8 }}>· {prescription.doctor.specialization}</span>}
        </div>

        {/* Diagnosis */}
        {prescription.diagnosis && (
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:'0.75rem', fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 }}>Diagnosis</div>
            <p style={{ fontSize:'0.9rem', color:'var(--text-primary)' }}>{prescription.diagnosis}</p>
          </div>
        )}

        {/* Medicines */}
        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:'0.75rem', fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8 }}>Medicines</div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {(prescription.medicines || []).map((m, i) => (
              <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:12, padding:'10px 14px', background:'var(--bg-card-hover)', borderRadius:'var(--radius-md)', border:'1px solid var(--border)' }}>
                <Pill size={15} color="var(--teal-400)" style={{ marginTop:2, flexShrink:0 }} />
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:600, fontSize:'0.9rem' }}>{m.name}
                    {m.dosage && <span style={{ fontWeight:400, color:'var(--text-muted)', fontSize:'0.82rem', marginLeft:8 }}>{m.dosage}</span>}
                  </div>
                  <div style={{ fontSize:'0.8rem', color:'var(--text-secondary)', marginTop:2 }}>
                    {m.frequency}{m.timing ? ` · ${m.timing.replace(/_/g, ' ')}` : ''}{m.duration ? ` · ${m.duration}` : ''}
                  </div>
                  {m.instructions && <div style={{ fontSize:'0.78rem', color:'var(--text-muted)', marginTop:2, fontStyle:'italic' }}>{m.instructions}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Lab tests */}
        {prescription.labTests?.length > 0 && (
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:'0.75rem', fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8 }}>Lab Tests</div>
            {prescription.labTests.map((t, i) => (
              <div key={i} style={{ fontSize:'0.85rem', padding:'6px 12px', background:'rgba(255,183,77,0.08)', borderRadius:'var(--radius-sm)', marginBottom:4, borderLeft:'3px solid var(--amber-400,#ffb74d)' }}>
                {t.name}{t.urgent ? ' 🚨 Urgent' : ''}{t.reason ? ` — ${t.reason}` : ''}
              </div>
            ))}
          </div>
        )}

        {/* Instructions */}
        {prescription.instructions && (
          <div style={{ padding:'10px 14px', background:'rgba(66,165,245,0.05)', borderRadius:'var(--radius-sm)', borderLeft:'3px solid var(--teal-400)', fontSize:'0.85rem', color:'var(--text-secondary)', marginBottom:16 }}>
            <strong>Instructions:</strong> {prescription.instructions}
          </div>
        )}

        {/* Follow-up */}
        {prescription.followUpDate && (
          <div style={{ fontSize:'0.82rem', color:'var(--text-muted)', marginBottom:8 }}>
            📅 Follow-up: {new Date(prescription.followUpDate).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })}
          </div>
        )}

        <Button onClick={onClose} style={{ marginTop:8, width:'100%' }}>Close</Button>
      </div>
    </div>
  )
}

export default function AppointmentsPage() {
  const [appts, setAppts] = useState([])
  const [doctors, setDoctors] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState('all')
  const [form, setForm] = useState({ doctorId:'', date:'', time:'', type:'in_person', notes:'' })
  const [selectedPrescription, setSelectedPrescription] = useState(null)

  const load = async () => {
    const [apptsRes, docsRes] = await Promise.allSettled([appointmentAPI.getAll(), patientAPI.getDoctors()])
    if (apptsRes.status === 'fulfilled') setAppts(apptsRes.value.data.data || apptsRes.value.data || [])
    if (docsRes.status === 'fulfilled') setDoctors(docsRes.value.data.data || docsRes.value.data || [])
  }

  useEffect(() => { load() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.doctorId || !form.date || !form.time || !form.notes) return toast.error('Please fill all required fields')
    setLoading(true)
    try {
      const scheduledAt = new Date(`${form.date}T${form.time}`)
      await appointmentAPI.book({
        doctorId: form.doctorId,
        scheduledAt: scheduledAt.toISOString(),
        type: form.type,
        reason: form.notes || 'General consultation',
        notes: form.notes,
      })
      toast.success('Appointment booked!')
      setShowForm(false)
      setForm({ doctorId:'', date:'', time:'', type:'in_person', notes:'' })
      load()
    } catch {}
    finally { setLoading(false) }
  }

  const cancel = async (id) => {
    if (!window.confirm('Cancel this appointment?')) return
    try { await appointmentAPI.cancel(id); toast.success('Appointment cancelled'); load() } catch {}
  }

  const filtered = filter === 'all' ? appts : appts.filter(a => a.status === filter)

  return (
    <div className="animate-fade" style={{ display:'flex', flexDirection:'column', gap:24 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontFamily:'var(--font-display)', fontSize:'1.5rem', fontWeight:700, marginBottom:4 }}>Appointments</h1>
          <p style={{ color:'var(--text-secondary)', fontSize:'0.875rem' }}>Schedule and manage your doctor visits</p>
        </div>
        <Button icon={showForm ? <X size={16} /> : <Plus size={16} />} onClick={() => setShowForm(p => !p)}>
          {showForm ? 'Cancel' : 'Book Appointment'}
        </Button>
      </div>

      {/* Book form */}
      {showForm && (
        <div className="card" style={{ padding:24 }}>
          <h3 style={{ fontFamily:'var(--font-display)', fontWeight:600, marginBottom:20 }}>Book New Appointment</h3>
          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <div>
              <label style={{ fontSize:'0.82rem', fontWeight:600, color:'var(--text-secondary)', display:'block', marginBottom:6 }}>Doctor *</label>
              <select value={form.doctorId} onChange={e => setForm(p => ({ ...p, doctorId: e.target.value }))} required
                style={{ width:'100%', padding:'10px 14px', background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--radius-md)', color:'var(--text-primary)', fontSize:'0.875rem', fontFamily:'var(--font-body)' }}>
                <option value="">Select a doctor</option>
                {doctors.map(d => <option key={d._id} value={d._id}>Dr. {d.firstName} {d.lastName} — {d.specialization}</option>)}
              </select>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
              <Input label="Date *" type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} required min={new Date().toISOString().split('T')[0]} />
              <Input label="Time *" type="time" value={form.time} onChange={e => setForm(p => ({ ...p, time: e.target.value }))} required />
            </div>
            <div>
              <label style={{ fontSize:'0.82rem', fontWeight:600, color:'var(--text-secondary)', display:'block', marginBottom:6 }}>Type</label>
              <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                style={{ width:'100%', padding:'10px 14px', background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--radius-md)', color:'var(--text-primary)', fontSize:'0.875rem', fontFamily:'var(--font-body)' }}>
                {[['in_person','In Person'],['video','Video Call'],['phone','Phone Call']].map(([val,label]) => <option key={val} value={val}>{label}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize:'0.82rem', fontWeight:600, color:'var(--text-secondary)', display:'block', marginBottom:6 }}>Reason for visit *</label>
              <input value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} required
                placeholder="Describe your symptoms or reason for visit"
                style={{ width:'100%', padding:'10px 14px', background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--radius-md)', color:'var(--text-primary)', fontSize:'0.875rem', fontFamily:'var(--font-body)' }} />
            </div>
            <Button type="submit" loading={loading} icon={<Calendar size={16} />}>Book Appointment</Button>
          </form>
        </div>
      )}

      {/* Filters */}
      <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
        {['all','pending','confirmed','completed','cancelled','no_show'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ padding:'6px 16px', borderRadius:'var(--radius-sm)', border:'1px solid', borderColor: filter === f ? 'var(--teal-400)' : 'var(--border)', background: filter === f ? 'rgba(66,165,245,0.1)' : 'transparent', color: filter === f ? 'var(--teal-400)' : 'var(--text-muted)', fontSize:'0.8rem', fontWeight:600, cursor:'pointer', textTransform:'capitalize', transition:'all var(--transition)' }}>
            {f === 'no_show' ? 'No-Show' : f}
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="card" style={{ padding:40, textAlign:'center', color:'var(--text-muted)' }}>
          <Calendar size={36} style={{ opacity:0.3, marginBottom:12 }} />
          <p style={{ fontSize:'0.875rem' }}>No appointments found</p>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {filtered.map((a, i) => {
            const Icon = STATUS_ICON[a.status] || AlertCircle
            const isNoShow = a.status === 'no_show'
            const hasPrescription = a.prescription && typeof a.prescription === 'object'
            return (
              <div key={i}>
                <div className="card" style={{ padding:'18px 20px', display:'flex', alignItems:'center', gap:16, flexWrap:'wrap', borderColor: isNoShow ? 'rgba(229,57,53,0.3)' : undefined }}>
                  <div style={{ width:44, height:44, borderRadius:12, background: isNoShow ? 'rgba(229,57,53,0.1)' : 'rgba(66,165,245,0.1)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <Calendar size={20} color={isNoShow ? 'var(--rose-400)' : 'var(--teal-400)'} />
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:600, marginBottom:2 }}>Dr. {a.doctor?.firstName} {a.doctor?.lastName}</div>
                    <div style={{ fontSize:'0.8rem', color:'var(--text-secondary)', marginBottom:4 }}>{a.doctor?.specialization} · {a.type?.replace('_',' ')}</div>
                    <div style={{ display:'flex', alignItems:'center', gap:12, fontSize:'0.8rem', color:'var(--text-muted)' }}>
                      <span style={{ display:'flex', alignItems:'center', gap:4 }}>
                        <Calendar size={12} /> {a.scheduledAt ? new Date(a.scheduledAt).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' }) : 'Not set'}
                      </span>
                      <span style={{ display:'flex', alignItems:'center', gap:4 }}>
                        <Clock size={12} /> {a.scheduledAt ? new Date(a.scheduledAt).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' }) : ''}
                      </span>
                    </div>
                  </div>

                  <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                    <span className={`badge ${STATUS_BADGE[a.status] || 'badge-neutral'}`}><Icon size={10} /> {a.status === 'no_show' ? 'No-Show' : a.status}</span>

                    {hasPrescription && (
                      <button onClick={() => setSelectedPrescription(a.prescription)}
                        style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 12px', borderRadius:'var(--radius-sm)', background:'rgba(66,165,245,0.1)', border:'1px solid rgba(66,165,245,0.3)', color:'var(--teal-400)', fontSize:'0.78rem', fontWeight:600, cursor:'pointer' }}>
                        <FileText size={12} /> View Prescription
                      </button>
                    )}

                    {(a.status === 'pending' || a.status === 'confirmed') && (
                      <button onClick={() => cancel(a._id)}
                        style={{ background:'none', border:'1px solid var(--border)', padding:'6px 14px', borderRadius:'var(--radius-sm)', color:'var(--rose-400)', fontSize:'0.78rem', cursor:'pointer' }}>
                        Cancel
                      </button>
                    )}
                  </div>
                </div>

                {/* No-show warning banner */}
                {isNoShow && (
                  <div style={{ marginTop:6, padding:'12px 16px', background:'rgba(229,57,53,0.08)', border:'1px solid rgba(229,57,53,0.25)', borderRadius:'var(--radius-md)', display:'flex', alignItems:'flex-start', gap:10 }}>
                    <AlertTriangle size={16} color="var(--rose-400)" style={{ flexShrink:0, marginTop:1 }} />
                    <div style={{ flex:1 }}>
                      <p style={{ fontSize:'0.85rem', color:'var(--rose-400)', fontWeight:600, marginBottom:2 }}>
                        You did not reach in time
                      </p>
                      <p style={{ fontSize:'0.8rem', color:'var(--text-secondary)' }}>
                        This appointment was automatically cancelled because you did not arrive within 30 minutes of the scheduled time. Please book a new appointment.
                      </p>
                    </div>
                    <button onClick={() => setShowForm(true)}
                      style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 12px', borderRadius:'var(--radius-sm)', background:'var(--rose-400)', color:'white', border:'none', fontSize:'0.78rem', fontWeight:600, cursor:'pointer', flexShrink:0 }}>
                      <RefreshCw size={11} /> Book New
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {selectedPrescription && (
        <PrescriptionModal prescription={selectedPrescription} onClose={() => setSelectedPrescription(null)} />
      )}
    </div>
  )
}
