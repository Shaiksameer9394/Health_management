// src/pages/patient/Medications.jsx
import { useState, useEffect } from 'react'
import { medicationAPI } from '../../services/api'
import { Button, Input } from '../../components/common/UI'
import { Pill, Plus, Check, Clock, Trash2, Edit2, X } from 'lucide-react'
import toast from 'react-hot-toast'

// label → DB enum value mapping
const FREQ_OPTIONS = [
  { label: 'Once daily',         value: 'once_daily'    },
  { label: 'Twice daily',        value: 'twice_daily'   },
  { label: 'Three times daily',  value: 'three_times'   },
  { label: 'Every 6 hours',      value: 'every_6h'      },
  { label: 'Every 8 hours',      value: 'every_8h'      },
  { label: 'Every 12 hours',     value: 'every_12h'     },
  { label: 'Weekly',             value: 'weekly'        },
  { label: 'As needed',          value: 'as_needed'     },
]
// Helper: get display label from stored enum value
const freqLabel = (val) => FREQ_OPTIONS.find(f => f.value === val)?.label || val
const TIMES = ['Morning','Afternoon','Evening','Night','Before meals','After meals']

export default function MedicationsPage() {
  const [meds, setMeds] = useState([])
  const [today, setToday] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editMed, setEditMed] = useState(null)
  const [loading, setLoading] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [form, setForm] = useState({ name:'', dosage:'', frequency:'once_daily', times:[], startDate:'', endDate:'', instructions:'' })

  const load = async () => {
    const [allRes, todayRes] = await Promise.allSettled([medicationAPI.getAll(), medicationAPI.getToday()])
    if (allRes.status === 'fulfilled') setMeds(allRes.value.data.data || allRes.value.data || [])
    if (todayRes.status === 'fulfilled') setToday(todayRes.value.data.data || todayRes.value.data || [])
  }

  useEffect(() => { load() }, [])

  const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }))

  const toggleTime = (t) => setForm(p => ({ ...p, times: p.times.includes(t) ? p.times.filter(x => x !== t) : [...p.times, t] }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.dosage) return toast.error('Name and dosage are required')
    setLoading(true)
    try {
      if (editMed) {
        await medicationAPI.update(editMed._id, form)
        toast.success('Medication updated')
      } else {
        await medicationAPI.add(form)
        toast.success('Medication added')
      }
      setShowForm(false); setEditMed(null)
      setForm({ name:'', dosage:'', frequency:'once_daily', times:[], startDate:'', endDate:'', instructions:'' })
      load()
    } catch (err) { toast.error(err?.response?.data?.message || 'Failed to save medication') }
    finally { setLoading(false) }
  }

  const markTaken = async (id, dose) => {
    try {
      await medicationAPI.markTaken(id, dose)
      toast.success('Marked as taken!')
      load()
    } catch (err) { toast.error(err?.response?.data?.message || 'Could not mark as taken') }
  }

  const deleteMed = async (id) => {
    if (confirmDelete !== id) { setConfirmDelete(id); return }
    try { await medicationAPI.delete(id); toast.success('Medication deleted'); setConfirmDelete(null); load() }
    catch (err) { toast.error(err?.response?.data?.message || 'Could not delete medication') }
  }

  const startEdit = (med) => {
    setEditMed(med)
    setForm({ name:med.name, dosage:med.dosage, frequency:med.frequency, times:med.times||[], startDate:med.startDate?.split('T')[0]||'', endDate:med.endDate?.split('T')[0]||'', instructions:med.instructions||'' })
    setShowForm(true)
  }

  return (
    <div className="animate-fade" style={{ display:'flex', flexDirection:'column', gap:24 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontFamily:'var(--font-display)', fontSize:'1.5rem', fontWeight:700, marginBottom:4 }}>Medications</h1>
          <p style={{ color:'var(--text-secondary)', fontSize:'0.875rem' }}>Track your prescriptions and daily intake</p>
        </div>
        <Button icon={showForm ? <X size={16} /> : <Plus size={16} />} onClick={() => { setShowForm(p => !p); setEditMed(null) }}>
          {showForm ? 'Cancel' : 'Add Medication'}
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="card" style={{ padding:24 }}>
          <h3 style={{ fontFamily:'var(--font-display)', fontWeight:600, marginBottom:20 }}>{editMed ? 'Edit Medication' : 'Add New Medication'}</h3>
          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
              <Input label="Medication name" name="name" placeholder="e.g. Metformin" value={form.name} onChange={handleChange} icon={Pill} required />
              <Input label="Dosage" name="dosage" placeholder="e.g. 500mg" value={form.dosage} onChange={handleChange} required />
            </div>
            <div>
              <label style={{ fontSize:'0.82rem', fontWeight:600, color:'var(--text-secondary)', display:'block', marginBottom:6 }}>Frequency</label>
              <select name="frequency" value={form.frequency} onChange={handleChange}
                style={{ padding:'10px 14px', background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--radius-md)', color:'var(--text-primary)', fontSize:'0.875rem', fontFamily:'var(--font-body)', width:'100%' }}>
                {FREQ_OPTIONS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize:'0.82rem', fontWeight:600, color:'var(--text-secondary)', display:'block', marginBottom:8 }}>Times</label>
              <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                {TIMES.map(t => (
                  <button key={t} type="button" onClick={() => toggleTime(t)}
                    style={{ padding:'6px 14px', borderRadius:'var(--radius-sm)', border:'1px solid', borderColor: form.times.includes(t) ? 'var(--teal-400)' : 'var(--border)', background: form.times.includes(t) ? 'rgba(66,165,245,0.15)' : 'transparent', color: form.times.includes(t) ? 'var(--teal-400)' : 'var(--text-muted)', fontSize:'0.8rem', cursor:'pointer', transition:'all var(--transition)' }}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
              <Input label="Start date" name="startDate" type="date" value={form.startDate} onChange={handleChange} />
              <Input label="End date (optional)" name="endDate" type="date" value={form.endDate} onChange={handleChange} />
            </div>
            <div>
              <label style={{ fontSize:'0.82rem', fontWeight:600, color:'var(--text-secondary)', display:'block', marginBottom:6 }}>Instructions</label>
              <textarea name="instructions" value={form.instructions} onChange={handleChange} placeholder="e.g. Take with food" rows={2}
                style={{ width:'100%', padding:'10px 14px', background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--radius-md)', color:'var(--text-primary)', fontSize:'0.875rem', fontFamily:'var(--font-body)', resize:'vertical' }} />
            </div>
            <Button type="submit" loading={loading}>{editMed ? 'Update Medication' : 'Add Medication'}</Button>
          </form>
        </div>
      )}

      {/* Today's schedule */}
      {today.length > 0 && (
        <div className="card" style={{ padding:24 }}>
          <h3 style={{ fontFamily:'var(--font-display)', fontWeight:600, marginBottom:16, display:'flex', alignItems:'center', gap:8 }}>
            <Clock size={16} color="var(--teal-400)" /> Today's Schedule
          </h3>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:12 }}>
            {today.map((m, i) => (
              <div key={i} style={{ padding:'14px 16px', borderRadius:'var(--radius-md)', background: m.takenToday ? 'rgba(67,160,71,0.06)' : 'var(--bg-card-hover)', border:'1px solid', borderColor: m.takenToday ? 'rgba(67,160,71,0.2)' : 'var(--border)' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                  <span style={{ fontWeight:600, fontSize:'0.9rem' }}>{m.name}</span>
                  {m.takenToday ? <span className="badge badge-success"><Check size={10} /> Taken</span> : null}
                </div>
                <div style={{ fontSize:'0.78rem', color:'var(--text-secondary)', marginBottom:10 }}>{m.dosage} · {freqLabel(m.frequency)}</div>
                {!m.takenToday && (
                  <Button size="sm" variant="outline" fullWidth onClick={() => markTaken(m._id, m.dosage)} icon={<Check size={12} />}>Mark Taken</Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All medications */}
      <div className="card" style={{ padding:24 }}>
        <h3 style={{ fontFamily:'var(--font-display)', fontWeight:600, marginBottom:16 }}>All Medications</h3>
        {meds.length === 0 ? (
          <p style={{ color:'var(--text-muted)', textAlign:'center', padding:'24px 0', fontSize:'0.875rem' }}>No medications added yet</p>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {meds.map((m, i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:16, padding:'14px 16px', borderRadius:'var(--radius-md)', background:'var(--bg-card-hover)', border:'1px solid var(--border)' }}>
                <div style={{ width:36, height:36, borderRadius:10, background:'rgba(66,165,245,0.1)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <Pill size={16} color="var(--teal-400)" />
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:600 }}>{m.name}</div>
                  <div style={{ fontSize:'0.78rem', color:'var(--text-secondary)' }}>{m.dosage} · {freqLabel(m.frequency)}</div>
                  {m.instructions && <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', marginTop:2 }}>{m.instructions}</div>}
                </div>
                {m.isActive ? <span className="badge badge-success">Active</span> : <span className="badge badge-neutral">Inactive</span>}
                <div style={{ display:'flex', gap:8 }}>
                  <button onClick={() => startEdit(m)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', padding:4 }}><Edit2 size={14} /></button>
                  <button onClick={() => deleteMed(m._id)}
                    style={{ background: confirmDelete===m._id ? 'rgba(229,57,53,0.15)' : 'none', border: confirmDelete===m._id ? '1px solid var(--rose-400)' : 'none', borderRadius:6, cursor:'pointer', color:'var(--rose-400)', padding:'4px 8px', fontSize:'0.72rem', fontWeight:600, transition:'all 0.2s' }}>
                    {confirmDelete===m._id ? 'Confirm?' : <Trash2 size={14} />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}