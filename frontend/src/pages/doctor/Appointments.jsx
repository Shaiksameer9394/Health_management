// src/pages/doctor/Appointments.jsx
import { useState, useEffect } from 'react'
import { doctorAPI, appointmentAPI } from '../../services/api'
import {
  Calendar, Clock, CheckCircle, XCircle, UserCheck,
  ClipboardList, Plus, Trash2, Pill
} from 'lucide-react'
import { Button } from '../../components/common/UI'
import toast from 'react-hot-toast'

const STATUS_COLOR = {
  confirmed: 'badge-success',
  pending:   'badge-warning',
  cancelled: 'badge-danger',
  completed: 'badge-neutral',
  no_show:   'badge-danger',
}

// ─── Inline prescription form ─────────────────────────────────────────────────
function PrescriptionForm({ appointment, onDone, onCancel }) {
  const EMPTY_MED = { name:'', dosage:'', frequency:'', timing:'after_meal', duration:'', instructions:'' }
  const [diagnosis, setDiagnosis] = useState('')
  const [medicines, setMedicines] = useState([{ ...EMPTY_MED }])
  const [instructions, setInstructions] = useState('')
  const [saving, setSaving] = useState(false)

  const addMed = () => setMedicines(m => [...m, { ...EMPTY_MED }])
  const removeMed = (i) => setMedicines(m => m.filter((_, idx) => idx !== i))
  const updateMed = (i, field, val) => setMedicines(m => m.map((med, idx) => idx === i ? { ...med, [field]: val } : med))

  const handleSave = async () => {
    if (!diagnosis.trim()) return toast.error('Diagnosis is required')
    if (!medicines[0].name.trim()) return toast.error('At least one medicine name is required')
    setSaving(true)
    try {
      await doctorAPI.addPrescription(appointment.patient._id, {
        diagnosis,
        medicines,
        instructions,
        appointmentId: appointment._id,
      })
      toast.success('Prescription saved!')
      onDone()
    } catch {}
    finally { setSaving(false) }
  }

  const inputStyle = { width:'100%', padding:'8px 10px', background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', color:'var(--text-primary)', fontSize:'0.82rem', fontFamily:'var(--font-body)' }
  const labelStyle = { fontSize:'0.75rem', fontWeight:600, color:'var(--text-muted)', display:'block', marginBottom:4, textTransform:'uppercase', letterSpacing:'0.05em' }

  return (
    <div style={{ marginTop:12, padding:20, background:'rgba(66,165,245,0.04)', border:'1px solid rgba(66,165,245,0.2)', borderRadius:'var(--radius-md)' }}>
      <h4 style={{ fontFamily:'var(--font-display)', fontWeight:600, marginBottom:16, display:'flex', alignItems:'center', gap:8 }}>
        <ClipboardList size={16} color="var(--teal-400)" /> Write Prescription for {appointment.patient?.firstName} {appointment.patient?.lastName}
      </h4>

      {/* Diagnosis */}
      <div style={{ marginBottom:14 }}>
        <label style={labelStyle}>Diagnosis *</label>
        <input value={diagnosis} onChange={e => setDiagnosis(e.target.value)} placeholder="e.g. Viral Fever, Type 2 Diabetes" style={inputStyle} />
      </div>

      {/* Medicines */}
      <div style={{ marginBottom:14 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
          <label style={labelStyle}>Medicines *</label>
          <button onClick={addMed} style={{ display:'flex', alignItems:'center', gap:4, padding:'4px 10px', background:'rgba(66,165,245,0.1)', border:'1px solid rgba(66,165,245,0.25)', borderRadius:'var(--radius-sm)', color:'var(--teal-400)', fontSize:'0.75rem', fontWeight:600, cursor:'pointer' }}>
            <Plus size={12} /> Add
          </button>
        </div>
        {medicines.map((med, i) => (
          <div key={i} style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1.5fr 1.5fr 1fr auto', gap:8, marginBottom:8, alignItems:'end' }}>
            <div>
              {i === 0 && <label style={labelStyle}>Name</label>}
              <input value={med.name} onChange={e => updateMed(i, 'name', e.target.value)} placeholder="Medicine name" style={inputStyle} />
            </div>
            <div>
              {i === 0 && <label style={labelStyle}>Dosage</label>}
              <input value={med.dosage} onChange={e => updateMed(i, 'dosage', e.target.value)} placeholder="500mg" style={inputStyle} />
            </div>
            <div>
              {i === 0 && <label style={labelStyle}>Frequency</label>}
              <input value={med.frequency} onChange={e => updateMed(i, 'frequency', e.target.value)} placeholder="3 times a day" style={inputStyle} />
            </div>
            <div>
              {i === 0 && <label style={labelStyle}>Timing</label>}
              <select value={med.timing} onChange={e => updateMed(i, 'timing', e.target.value)} style={inputStyle}>
                {[['before_meal','Before Meal'],['after_meal','After Meal'],['with_meal','With Meal'],['bedtime','Bedtime'],['morning','Morning'],['evening','Evening'],['as_needed','As Needed']].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              {i === 0 && <label style={labelStyle}>Duration</label>}
              <input value={med.duration} onChange={e => updateMed(i, 'duration', e.target.value)} placeholder="7 days" style={inputStyle} />
            </div>
            <div style={{ paddingTop: i === 0 ? 18 : 0 }}>
              {medicines.length > 1 && (
                <button onClick={() => removeMed(i)} style={{ background:'rgba(229,57,53,0.1)', border:'1px solid rgba(229,57,53,0.2)', borderRadius:'var(--radius-sm)', color:'var(--rose-400)', padding:'7px 9px', cursor:'pointer', display:'flex', alignItems:'center' }}>
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Instructions */}
      <div style={{ marginBottom:16 }}>
        <label style={labelStyle}>General Instructions</label>
        <textarea value={instructions} onChange={e => setInstructions(e.target.value)} rows={2}
          placeholder="Rest well, drink plenty of water..."
          style={{ ...inputStyle, resize:'vertical' }} />
      </div>

      <div style={{ display:'flex', gap:10 }}>
        <Button onClick={handleSave} loading={saving} icon={<CheckCircle size={14} />}>Save Prescription</Button>
        <button onClick={onCancel} style={{ padding:'8px 16px', borderRadius:'var(--radius-sm)', border:'1px solid var(--border)', background:'none', color:'var(--text-muted)', fontSize:'0.85rem', cursor:'pointer' }}>Cancel</button>
      </div>
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function DoctorAppointments() {
  const [appts, setAppts] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [prescribingFor, setPrescribingFor] = useState(null)  // appointmentId

  const load = () => {
    doctorAPI.getAppointments()
      .then(res => setAppts(res.data.data || res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const confirmAppt = async (id) => {
    try { await appointmentAPI.confirm(id); toast.success('Appointment confirmed'); load() } catch {}
  }

  const cancel = async (id) => {
    if (!window.confirm('Cancel this appointment?')) return
    try { await appointmentAPI.cancel(id); toast.success('Cancelled'); load() } catch {}
  }

  const markArrived = async (id) => {
    try { await appointmentAPI.markArrived(id); toast.success('Patient marked as arrived!'); load() } catch {}
  }

  const filtered = filter === 'all' ? appts : appts.filter(a => a.status === filter)

  // Group by date using scheduledAt (not the non-existent 'date' field)
  const grouped = filtered.reduce((acc, a) => {
    const d = a.scheduledAt ? new Date(a.scheduledAt).toDateString() : 'Unknown'
    if (!acc[d]) acc[d] = []
    acc[d].push(a)
    return acc
  }, {})

  return (
    <div className="animate-fade" style={{ display:'flex', flexDirection:'column', gap:24 }}>
      <div>
        <h1 style={{ fontFamily:'var(--font-display)', fontSize:'1.5rem', fontWeight:700, marginBottom:4 }}>Appointments</h1>
        <p style={{ color:'var(--text-secondary)', fontSize:'0.875rem' }}>{appts.length} total appointment{appts.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
        {['all','pending','confirmed','completed','cancelled','no_show'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ padding:'6px 16px', borderRadius:'var(--radius-sm)', border:'1px solid', borderColor: filter === f ? 'var(--teal-400)' : 'var(--border)', background: filter === f ? 'rgba(66,165,245,0.1)' : 'transparent', color: filter === f ? 'var(--teal-400)' : 'var(--text-muted)', fontSize:'0.8rem', fontWeight:600, cursor:'pointer', textTransform:'capitalize', transition:'all var(--transition)' }}>
            {f === 'no_show' ? 'No-Show' : f}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ color:'var(--text-muted)', textAlign:'center', padding:40 }}>Loading…</p>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ padding:60, textAlign:'center', color:'var(--text-muted)' }}>
          <Calendar size={40} style={{ opacity:0.2, marginBottom:12 }} />
          <p style={{ fontSize:'0.875rem' }}>No appointments found</p>
        </div>
      ) : (
        Object.entries(grouped)
          .sort(([a],[b]) => new Date(a) - new Date(b))
          .map(([date, dayAppts]) => (
            <div key={date}>
              <div style={{ fontSize:'0.78rem', fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:12, display:'flex', alignItems:'center', gap:8 }}>
                <Calendar size={12} />
                {date === 'Unknown' ? 'Unknown Date' : new Date(date).toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long' })}
                {new Date(date).toDateString() === new Date().toDateString() && (
                  <span className="badge badge-info" style={{ fontSize:'0.65rem' }}>Today</span>
                )}
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {dayAppts
                  .sort((a,b) => new Date(a.scheduledAt) - new Date(b.scheduledAt))
                  .map((a, i) => (
                    <div key={i}>
                      <div className="card" style={{ padding:'16px 20px', display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>
                        <div style={{ width:40, height:40, borderRadius:'50%', background:'linear-gradient(135deg,var(--teal-700),var(--jade-600))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.85rem', fontWeight:700, flexShrink:0 }}>
                          {a.patient?.firstName?.[0]}{a.patient?.lastName?.[0]}
                        </div>
                        <div style={{ flex:1 }}>
                          <div style={{ fontWeight:600, marginBottom:2 }}>{a.patient?.firstName} {a.patient?.lastName}</div>
                          <div style={{ fontSize:'0.78rem', color:'var(--text-secondary)', display:'flex', gap:10 }}>
                            <span style={{ display:'flex', alignItems:'center', gap:4 }}>
                              <Clock size={11} />
                              {a.scheduledAt ? new Date(a.scheduledAt).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' }) : '—'}
                            </span>
                            <span style={{ textTransform:'capitalize' }}>{a.type?.replace(/_/g,' ')}</span>
                            {a.patientArrived && <span style={{ color:'var(--green-400,#66bb6a)', fontWeight:600 }}>✓ Arrived</span>}
                          </div>
                          {a.notes && <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', marginTop:4 }}>{a.notes}</div>}
                        </div>

                        <span className={`badge ${STATUS_COLOR[a.status] || 'badge-neutral'}`}>{a.status === 'no_show' ? 'No-Show' : a.status}</span>

                        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                          {/* Confirm button for pending */}
                          {a.status === 'pending' && (
                            <button onClick={() => confirmAppt(a._id)}
                              style={{ display:'flex', alignItems:'center', gap:4, padding:'6px 12px', borderRadius:'var(--radius-sm)', background:'rgba(67,160,71,0.1)', border:'1px solid rgba(67,160,71,0.25)', color:'var(--green-400,#66bb6a)', fontSize:'0.78rem', fontWeight:600, cursor:'pointer' }}>
                              <CheckCircle size={12} /> Confirm
                            </button>
                          )}

                          {/* Mark Arrived — for confirmed appointments where patient hasn't arrived yet */}
                          {a.status === 'confirmed' && !a.patientArrived && (
                            <button onClick={() => markArrived(a._id)}
                              style={{ display:'flex', alignItems:'center', gap:4, padding:'6px 12px', borderRadius:'var(--radius-sm)', background:'rgba(66,165,245,0.1)', border:'1px solid rgba(66,165,245,0.3)', color:'var(--teal-400)', fontSize:'0.78rem', fontWeight:600, cursor:'pointer' }}>
                              <UserCheck size={12} /> Mark Arrived
                            </button>
                          )}

                          {/* Write Prescription — only when patient has arrived and no prescription yet */}
                          {a.patientArrived && !a.prescription && a.status !== 'cancelled' && a.status !== 'no_show' && (
                            <button onClick={() => setPrescribingFor(prescribingFor === a._id ? null : a._id)}
                              style={{ display:'flex', alignItems:'center', gap:4, padding:'6px 12px', borderRadius:'var(--radius-sm)', background:'rgba(156,39,176,0.1)', border:'1px solid rgba(156,39,176,0.25)', color:'#ba68c8', fontSize:'0.78rem', fontWeight:600, cursor:'pointer' }}>
                              <Pill size={12} /> {prescribingFor === a._id ? 'Close Form' : 'Write Prescription'}
                            </button>
                          )}

                          {/* Prescription already written */}
                          {a.prescription && (
                            <span style={{ display:'flex', alignItems:'center', gap:4, padding:'6px 12px', borderRadius:'var(--radius-sm)', background:'rgba(67,160,71,0.08)', border:'1px solid rgba(67,160,71,0.2)', color:'var(--green-400,#66bb6a)', fontSize:'0.78rem', fontWeight:500 }}>
                              <ClipboardList size={12} /> Prescription Written
                            </span>
                          )}

                          {/* Cancel */}
                          {(a.status === 'pending' || a.status === 'confirmed') && (
                            <button onClick={() => cancel(a._id)}
                              style={{ display:'flex', alignItems:'center', gap:4, padding:'6px 12px', borderRadius:'var(--radius-sm)', background:'rgba(229,57,53,0.08)', border:'1px solid rgba(229,57,53,0.2)', color:'var(--rose-400)', fontSize:'0.78rem', fontWeight:600, cursor:'pointer' }}>
                              <XCircle size={12} /> Cancel
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Inline prescription form */}
                      {prescribingFor === a._id && (
                        <PrescriptionForm
                          appointment={a}
                          onDone={() => { setPrescribingFor(null); load() }}
                          onCancel={() => setPrescribingFor(null)}
                        />
                      )}
                    </div>
                  ))}
              </div>
            </div>
          ))
      )}
    </div>
  )
}
