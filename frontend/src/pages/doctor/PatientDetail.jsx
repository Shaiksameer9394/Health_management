// src/pages/doctor/PatientDetail.jsx
import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { doctorAPI } from '../../services/api'
import { Button } from '../../components/common/UI'
import { ArrowLeft, Pill, Send, ClipboardList, Plus, Trash2, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function DoctorPatientDetail() {
  const { id } = useParams()
  const [patient, setPatient] = useState(null)
  const [prescriptions, setPrescriptions] = useState([])
  const [activeTab, setActiveTab] = useState('overview')
  const [noteText, setNoteText] = useState('')
  const [showRxForm, setShowRxForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [rxForm, setRxForm] = useState({
    diagnosis: '',
    medicines: [{ name:'', dosage:'', frequency:'', timing:'after_meal', duration:'', instructions:'' }],
    instructions: '',
  })

  useEffect(() => {
    Promise.allSettled([doctorAPI.getPatient(id), doctorAPI.getPrescriptions(id)])
      .then(([pRes, rxRes]) => {
        if (pRes.status === 'fulfilled') setPatient(pRes.value.data.data || pRes.value.data)
        if (rxRes.status === 'fulfilled') setPrescriptions(rxRes.value.data.data || rxRes.value.data || [])
      })
  }, [id])

  const addNote = async () => {
    if (!noteText.trim()) return
    try { await doctorAPI.addNote(id, noteText); toast.success('Note saved'); setNoteText('') } catch {}
  }

  const addMed = () => setRxForm(p => ({ ...p, medicines:[...p.medicines,{ name:'', dosage:'', frequency:'', timing:'after_meal', duration:'', instructions:'' }] }))
  const removeMed = (i) => setRxForm(p => ({ ...p, medicines:p.medicines.filter((_,j)=>j!==i) }))
  const updateMed = (i, field, val) => setRxForm(p => { const m=[...p.medicines]; m[i]={...m[i],[field]:val}; return {...p,medicines:m} })

  const submitPrescription = async () => {
    if (!rxForm.diagnosis.trim()) return toast.error('Diagnosis is required')
    if (!rxForm.medicines[0].name.trim()) return toast.error('Add at least one medicine')
    setSaving(true)
    try {
      await doctorAPI.addPrescription(id, {
        diagnosis: rxForm.diagnosis,
        medicines: rxForm.medicines,
        instructions: rxForm.instructions,
      })
      toast.success('Prescription issued!')
      setShowRxForm(false)
      setRxForm({ diagnosis:'', medicines:[{ name:'', dosage:'', frequency:'', timing:'after_meal', duration:'', instructions:'' }], instructions:'' })
      doctorAPI.getPrescriptions(id).then(res => setPrescriptions(res.data.data || res.data || []))
    } catch {}
    finally { setSaving(false) }
  }

  const inputStyle = { width:'100%', padding:'8px 10px', background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', color:'var(--text-primary)', fontSize:'0.82rem', fontFamily:'var(--font-body)', boxSizing:'border-box' }
  const labelStyle = { fontSize:'0.75rem', fontWeight:600, color:'var(--text-muted)', display:'block', marginBottom:4, textTransform:'uppercase', letterSpacing:'0.05em' }

  const vitals = patient?.latestVitals || {}

  if (!patient) return <div style={{ textAlign:'center', padding:60, color:'var(--text-muted)' }}>Loading patient data…</div>

  return (
    <div className="animate-fade" style={{ display:'flex', flexDirection:'column', gap:24 }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>
        <Link to="/doctor/patients" style={{ display:'flex', alignItems:'center', gap:6, color:'var(--text-muted)', fontSize:'0.85rem' }}>
          <ArrowLeft size={14} /> Patients
        </Link>
        <div style={{ flex:1, display:'flex', alignItems:'center', gap:16 }}>
          <div style={{ width:52, height:52, borderRadius:'50%', background:'linear-gradient(135deg,var(--teal-700),var(--jade-600))', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-display)', fontWeight:700, fontSize:'1.1rem', color:'white' }}>
            {patient.firstName?.[0]}{patient.lastName?.[0]}
          </div>
          <div>
            <h1 style={{ fontFamily:'var(--font-display)', fontSize:'1.4rem', fontWeight:700, marginBottom:2 }}>{patient.firstName} {patient.lastName}</h1>
            <div style={{ display:'flex', gap:12, fontSize:'0.8rem', color:'var(--text-secondary)' }}>
              {patient.phone && <span>📞 {patient.phone}</span>}
              {patient.medicalHistory?.bloodGroup && <span>🩸 {patient.medicalHistory.bloodGroup}</span>}
              {patient.dateOfBirth && <span>Age: {new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear()}</span>}
            </div>
          </div>
        </div>
        <Button icon={<Pill size={14} />} onClick={() => setShowRxForm(p => !p)}>
          {showRxForm ? 'Cancel Prescription' : 'Write Prescription'}
        </Button>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:4, background:'var(--bg-card)', padding:4, borderRadius:'var(--radius-md)', border:'1px solid var(--border)', width:'fit-content' }}>
        {[['overview','Overview'],['prescriptions',`Prescriptions (${prescriptions.length})`],['notes','Notes']].map(([key,label]) => (
          <button key={key} onClick={() => setActiveTab(key)}
            style={{ padding:'7px 18px', borderRadius:8, border:'none', background: activeTab===key ? 'var(--teal-600)' : 'transparent', color: activeTab===key ? 'white' : 'var(--text-secondary)', fontSize:'0.85rem', fontWeight:600, cursor:'pointer', transition:'all var(--transition)' }}>
            {label}
          </button>
        ))}
      </div>

      {/* Prescription Form */}
      {showRxForm && (
        <div className="card" style={{ padding:24, border:'1px solid rgba(66,165,245,0.2)' }}>
          <h3 style={{ fontFamily:'var(--font-display)', fontWeight:600, marginBottom:16, display:'flex', alignItems:'center', gap:8 }}>
            <ClipboardList size={16} color="var(--teal-400)" /> New Prescription for {patient.firstName} {patient.lastName}
          </h3>

          <div style={{ marginBottom:16 }}>
            <label style={labelStyle}>Diagnosis *</label>
            <input value={rxForm.diagnosis} onChange={e=>setRxForm(p=>({...p,diagnosis:e.target.value}))}
              placeholder="e.g. Viral Fever, Hypertension" style={inputStyle} />
          </div>

          <div style={{ marginBottom:16 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
              <label style={labelStyle}>Medicines *</label>
              <button onClick={addMed} style={{ display:'flex', alignItems:'center', gap:4, padding:'4px 10px', background:'rgba(66,165,245,0.1)', border:'1px solid rgba(66,165,245,0.25)', borderRadius:'var(--radius-sm)', color:'var(--teal-400)', fontSize:'0.75rem', fontWeight:600, cursor:'pointer' }}>
                <Plus size={12} /> Add Medicine
              </button>
            </div>
            {rxForm.medicines.map((med, i) => (
              <div key={i} style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1.5fr 1.5fr 1fr auto', gap:8, marginBottom:10, alignItems:'end' }}>
                <div>
                  {i===0 && <label style={labelStyle}>Name</label>}
                  <input value={med.name} onChange={e=>updateMed(i,'name',e.target.value)} placeholder="Medicine name" style={inputStyle} />
                </div>
                <div>
                  {i===0 && <label style={labelStyle}>Dosage</label>}
                  <input value={med.dosage} onChange={e=>updateMed(i,'dosage',e.target.value)} placeholder="500mg" style={inputStyle} />
                </div>
                <div>
                  {i===0 && <label style={labelStyle}>Frequency</label>}
                  <input value={med.frequency} onChange={e=>updateMed(i,'frequency',e.target.value)} placeholder="3x daily" style={inputStyle} />
                </div>
                <div>
                  {i===0 && <label style={labelStyle}>Timing</label>}
                  <select value={med.timing} onChange={e=>updateMed(i,'timing',e.target.value)} style={inputStyle}>
                    {[['before_meal','Before Meal'],['after_meal','After Meal'],['with_meal','With Meal'],['bedtime','Bedtime'],['morning','Morning'],['evening','Evening'],['as_needed','As Needed']].map(([v,l])=><option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div>
                  {i===0 && <label style={labelStyle}>Duration</label>}
                  <input value={med.duration} onChange={e=>updateMed(i,'duration',e.target.value)} placeholder="7 days" style={inputStyle} />
                </div>
                <div style={{ paddingTop: i===0 ? 18 : 0 }}>
                  {rxForm.medicines.length > 1 && (
                    <button onClick={()=>removeMed(i)} style={{ background:'rgba(229,57,53,0.1)', border:'1px solid rgba(229,57,53,0.2)', borderRadius:'var(--radius-sm)', color:'var(--rose-400)', padding:'7px 9px', cursor:'pointer', display:'flex', alignItems:'center' }}>
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginBottom:16 }}>
            <label style={labelStyle}>General Instructions</label>
            <textarea value={rxForm.instructions} onChange={e=>setRxForm(p=>({...p,instructions:e.target.value}))} rows={2}
              placeholder="Rest well, drink water, avoid spicy food..."
              style={{ ...inputStyle, resize:'vertical' }} />
          </div>

          <div style={{ display:'flex', gap:12 }}>
            <Button loading={saving} onClick={submitPrescription} icon={<CheckCircle size={14} />}>Issue Prescription</Button>
            <button onClick={()=>setShowRxForm(false)} style={{ padding:'8px 16px', borderRadius:'var(--radius-sm)', border:'1px solid var(--border)', background:'none', color:'var(--text-muted)', fontSize:'0.85rem', cursor:'pointer' }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
          <div className="card" style={{ padding:20 }}>
            <h3 style={{ fontFamily:'var(--font-display)', fontWeight:600, marginBottom:14, fontSize:'0.95rem' }}>Latest Vitals</h3>
            {Object.keys(vitals).length === 0 ? (
              <p style={{ color:'var(--text-muted)', fontSize:'0.85rem' }}>No vitals recorded yet</p>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {vitals.heartRate && <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.875rem' }}><span style={{ color:'var(--text-secondary)' }}>Heart Rate</span><strong>{vitals.heartRate} bpm</strong></div>}
                {vitals.bloodPressure?.systolic && <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.875rem' }}><span style={{ color:'var(--text-secondary)' }}>Blood Pressure</span><strong>{vitals.bloodPressure.systolic}/{vitals.bloodPressure.diastolic} mmHg</strong></div>}
                {vitals.bloodGlucose && <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.875rem' }}><span style={{ color:'var(--text-secondary)' }}>Blood Glucose</span><strong>{vitals.bloodGlucose} mg/dL</strong></div>}
                {vitals.oxygenSaturation && <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.875rem' }}><span style={{ color:'var(--text-secondary)' }}>SpO2</span><strong>{vitals.oxygenSaturation}%</strong></div>}
                {vitals.temperature && <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.875rem' }}><span style={{ color:'var(--text-secondary)' }}>Temperature</span><strong>{vitals.temperature}°C</strong></div>}
              </div>
            )}
          </div>
          <div className="card" style={{ padding:20 }}>
            <h3 style={{ fontFamily:'var(--font-display)', fontWeight:600, marginBottom:14, fontSize:'0.95rem' }}>Medical History</h3>
            <div style={{ display:'flex', flexDirection:'column', gap:8, fontSize:'0.875rem' }}>
              <div><span style={{ color:'var(--text-secondary)' }}>Blood Group: </span><strong>{patient.medicalHistory?.bloodGroup || '—'}</strong></div>
              <div><span style={{ color:'var(--text-secondary)' }}>Allergies: </span><strong>{patient.medicalHistory?.allergies?.join(', ') || 'None reported'}</strong></div>
              <div><span style={{ color:'var(--text-secondary)' }}>Chronic Conditions: </span><strong>{patient.medicalHistory?.chronicConditions?.join(', ') || 'None reported'}</strong></div>
            </div>
          </div>
        </div>
      )}

      {/* Prescriptions Tab */}
      {activeTab === 'prescriptions' && (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {prescriptions.length === 0 ? (
            <div className="card" style={{ padding:40, textAlign:'center', color:'var(--text-muted)' }}>
              <ClipboardList size={36} style={{ opacity:0.2, marginBottom:12 }} />
              <p style={{ fontSize:'0.875rem', marginBottom:16 }}>No prescriptions issued yet</p>
              <button onClick={()=>setShowRxForm(true)} style={{ padding:'8px 18px', borderRadius:'var(--radius-sm)', background:'var(--teal-600)', color:'white', border:'none', cursor:'pointer', fontWeight:600, fontSize:'0.85rem' }}>
                Write First Prescription
              </button>
            </div>
          ) : prescriptions.map((rx, i) => (
            <div key={i} className="card" style={{ padding:20 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                <div>
                  <span style={{ fontFamily:'var(--font-display)', fontWeight:600 }}>{rx.prescriptionNumber}</span>
                  {rx.diagnosis && <span style={{ marginLeft:12, fontSize:'0.8rem', color:'var(--text-secondary)', padding:'2px 10px', background:'rgba(66,165,245,0.1)', borderRadius:20 }}>{rx.diagnosis}</span>}
                </div>
                <span style={{ fontSize:'0.78rem', color:'var(--text-muted)' }}>{new Date(rx.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}</span>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {/* FIX: use rx.medicines (model field), not rx.medications */}
                {(rx.medicines || []).map((m, j) => (
                  <div key={j} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px', background:'var(--bg-card-hover)', borderRadius:'var(--radius-md)', border:'1px solid var(--border)' }}>
                    <Pill size={14} color="var(--teal-400)" />
                    <div style={{ flex:1 }}>
                      <span style={{ fontWeight:600, fontSize:'0.9rem' }}>{m.name}</span>
                      {m.dosage && <span style={{ color:'var(--text-muted)', fontSize:'0.8rem', marginLeft:8 }}>{m.dosage}</span>}
                    </div>
                    <div style={{ fontSize:'0.8rem', color:'var(--text-secondary)', textAlign:'right' }}>
                      <div>{m.frequency}</div>
                      {m.timing && <div style={{ color:'var(--text-muted)', fontSize:'0.75rem' }}>{m.timing.replace(/_/g,' ')}</div>}
                      {m.duration && <div style={{ color:'var(--text-muted)', fontSize:'0.75rem' }}>{m.duration}</div>}
                    </div>
                  </div>
                ))}
              </div>
              {rx.instructions && <p style={{ marginTop:12, fontSize:'0.85rem', color:'var(--text-secondary)', padding:'10px 14px', background:'rgba(66,165,245,0.05)', borderRadius:'var(--radius-sm)', borderLeft:'3px solid var(--teal-400)' }}>{rx.instructions}</p>}
              {rx.notes && <p style={{ marginTop:8, fontSize:'0.82rem', color:'var(--text-muted)', fontStyle:'italic' }}>📝 {rx.notes}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Notes Tab */}
      {activeTab === 'notes' && (
        <div className="card" style={{ padding:24 }}>
          <h3 style={{ fontFamily:'var(--font-display)', fontWeight:600, marginBottom:16 }}>Doctor's Notes</h3>
          <div style={{ display:'flex', gap:10, marginBottom:20 }}>
            <textarea value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Add a clinical note..." rows={3}
              style={{ flex:1, padding:'10px 14px', background:'var(--bg-card-hover)', border:'1px solid var(--border)', borderRadius:'var(--radius-md)', color:'var(--text-primary)', fontSize:'0.875rem', fontFamily:'var(--font-body)', resize:'vertical' }} />
            <Button icon={<Send size={14} />} onClick={addNote} style={{ alignSelf:'flex-start' }}>Save</Button>
          </div>
          {patient.doctorNotes?.length > 0 ? (
            [...patient.doctorNotes].reverse().map((n, i) => (
              <div key={i} style={{ padding:'12px 16px', borderRadius:'var(--radius-md)', background:'var(--bg-card-hover)', border:'1px solid var(--border)', marginBottom:10 }}>
                <p style={{ fontSize:'0.875rem', lineHeight:1.7 }}>{n.note}</p>
                <p style={{ fontSize:'0.72rem', color:'var(--text-muted)', marginTop:6 }}>{new Date(n.addedAt).toLocaleString()}</p>
              </div>
            ))
          ) : <p style={{ color:'var(--text-muted)', fontSize:'0.875rem' }}>No notes yet</p>}
        </div>
      )}
    </div>
  )
}
