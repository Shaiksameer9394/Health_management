// src/pages/doctor/Prescriptions.jsx
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { doctorAPI } from '../../services/api'
import { ClipboardList, Pill, Search, ArrowRight, User } from 'lucide-react'

export default function DoctorPrescriptions() {
  const [view, setView] = useState('all')  // 'all' | 'by-patient'
  const [allPrescriptions, setAllPrescriptions] = useState([])
  const [patients, setPatients]     = useState([])
  const [selected, setSelected]     = useState(null)
  const [patientRx, setPatientRx]   = useState([])
  const [search, setSearch]         = useState('')
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    Promise.allSettled([
      doctorAPI.getAllPrescriptions(),
      doctorAPI.getPatients(),
    ]).then(([rxRes, pRes]) => {
      if (rxRes.status === 'fulfilled') setAllPrescriptions(rxRes.value.data.data || rxRes.value.data || [])
      if (pRes.status === 'fulfilled') setPatients(pRes.value.data.data || pRes.value.data || [])
    }).finally(() => setLoading(false))
  }, [])

  const loadPatientRx = async (patient) => {
    setSelected(patient)
    setView('by-patient')
    try {
      const res = await doctorAPI.getPrescriptions(patient._id)
      setPatientRx(res.data.data || res.data || [])
    } catch {}
  }

  const filteredAll = allPrescriptions.filter(rx => {
    const name = `${rx.patient?.firstName || ''} ${rx.patient?.lastName || ''} ${rx.diagnosis || ''}`.toLowerCase()
    return name.includes(search.toLowerCase())
  })

  const filteredPatients = patients.filter(p =>
    `${p.firstName} ${p.lastName}`.toLowerCase().includes(search.toLowerCase())
  )

  const PrescriptionCard = ({ rx, index }) => (
    <div className="card" style={{ padding:20 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          {rx.patient && (
            <div style={{ width:32, height:32, borderRadius:'50%', background:'linear-gradient(135deg,var(--teal-700),var(--jade-600))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.75rem', fontWeight:700, color:'white', flexShrink:0 }}>
              {rx.patient.firstName?.[0]}{rx.patient.lastName?.[0]}
            </div>
          )}
          <div>
            {rx.patient && <div style={{ fontWeight:600, fontSize:'0.875rem' }}>{rx.patient.firstName} {rx.patient.lastName}</div>}
            <div style={{ fontSize:'0.78rem', color:'var(--text-muted)' }}>{rx.prescriptionNumber}</div>
          </div>
        </div>
        <div style={{ textAlign:'right' }}>
          {rx.diagnosis && <div style={{ fontSize:'0.78rem', padding:'2px 10px', background:'rgba(66,165,245,0.1)', color:'var(--teal-400)', borderRadius:20, marginBottom:4 }}>{rx.diagnosis}</div>}
          <div style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>{new Date(rx.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}</div>
        </div>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {/* FIX: use rx.medicines not rx.medications */}
        {(rx.medicines || []).map((m, j) => (
          <div key={j} style={{ display:'flex', alignItems:'center', gap:12, padding:'8px 14px', background:'var(--bg-card-hover)', borderRadius:'var(--radius-md)', border:'1px solid var(--border)' }}>
            <Pill size={13} color="var(--teal-400)" />
            <div style={{ flex:1 }}>
              <span style={{ fontWeight:600, fontSize:'0.875rem' }}>{m.name}</span>
              {m.dosage && <span style={{ color:'var(--text-muted)', fontSize:'0.8rem', marginLeft:8 }}>{m.dosage}</span>}
            </div>
            <div style={{ fontSize:'0.78rem', color:'var(--text-secondary)', textAlign:'right' }}>
              <div>{m.frequency}</div>
              {m.duration && <div style={{ color:'var(--text-muted)', fontSize:'0.72rem' }}>{m.duration}</div>}
            </div>
          </div>
        ))}
      </div>
      {rx.instructions && (
        <p style={{ marginTop:10, fontSize:'0.82rem', color:'var(--text-secondary)', padding:'8px 12px', background:'rgba(66,165,245,0.05)', borderRadius:'var(--radius-sm)', borderLeft:'3px solid var(--teal-400)' }}>
          {rx.instructions}
        </p>
      )}
    </div>
  )

  return (
    <div className="animate-fade" style={{ display:'flex', flexDirection:'column', gap:24 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontFamily:'var(--font-display)', fontSize:'1.5rem', fontWeight:700, marginBottom:4 }}>Prescriptions</h1>
          <p style={{ color:'var(--text-secondary)', fontSize:'0.875rem' }}>{allPrescriptions.length} prescription{allPrescriptions.length !== 1 ? 's' : ''} issued</p>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          {['all','by-patient'].map(v => (
            <button key={v} onClick={() => { setView(v); setSelected(null) }}
              style={{ padding:'7px 18px', borderRadius:'var(--radius-sm)', border:'1px solid', borderColor: view===v ? 'var(--teal-400)' : 'var(--border)', background: view===v ? 'rgba(66,165,245,0.1)' : 'transparent', color: view===v ? 'var(--teal-400)' : 'var(--text-muted)', fontSize:'0.82rem', fontWeight:600, cursor:'pointer' }}>
              {v === 'all' ? 'All Prescriptions' : 'By Patient'}
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div style={{ position:'relative', maxWidth:400 }}>
        <Search size={14} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)' }} />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder={view === 'all' ? "Search by patient or diagnosis..." : "Search patients..."}
          style={{ width:'100%', padding:'10px 14px 10px 36px', background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--radius-md)', color:'var(--text-primary)', fontSize:'0.875rem', fontFamily:'var(--font-body)', outline:'none' }} />
      </div>

      {loading ? (
        <div style={{ textAlign:'center', padding:40, color:'var(--text-muted)' }}>Loading…</div>
      ) : view === 'all' ? (
        /* All Prescriptions View */
        filteredAll.length === 0 ? (
          <div className="card" style={{ padding:60, textAlign:'center', color:'var(--text-muted)' }}>
            <ClipboardList size={48} style={{ opacity:0.15, marginBottom:16 }} />
            <p style={{ fontSize:'0.875rem' }}>No prescriptions issued yet</p>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {filteredAll.map((rx, i) => <PrescriptionCard key={rx._id || i} rx={rx} index={i} />)}
          </div>
        )
      ) : (
        /* By Patient View */
        <div style={{ display:'grid', gridTemplateColumns:'280px 1fr', gap:20, minHeight:400 }}>
          {/* Patient list */}
          <div className="card" style={{ padding:16, display:'flex', flexDirection:'column', gap:10 }}>
            <p style={{ fontSize:'0.78rem', fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em' }}>Select Patient</p>
            <div style={{ overflowY:'auto', flex:1 }}>
              {filteredPatients.length === 0 ? (
                <p style={{ color:'var(--text-muted)', fontSize:'0.82rem', padding:'10px 0' }}>No patients found</p>
              ) : filteredPatients.map((p, i) => (
                <button key={i} onClick={() => loadPatientRx(p)}
                  style={{ width:'100%', padding:'10px 12px', display:'flex', alignItems:'center', gap:10, background: selected?._id === p._id ? 'rgba(66,165,245,0.1)' : 'transparent', border:'none', borderRadius:'var(--radius-sm)', cursor:'pointer', textAlign:'left', transition:'all var(--transition)', marginBottom:4 }}>
                  <div style={{ width:32, height:32, borderRadius:'50%', background:'linear-gradient(135deg,var(--teal-700),var(--jade-600))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.75rem', fontWeight:700, flexShrink:0, color:'white' }}>
                    {p.firstName?.[0]}{p.lastName?.[0]}
                  </div>
                  <span style={{ fontSize:'0.85rem', fontWeight: selected?._id===p._id ? 600 : 400, color: selected?._id===p._id ? 'var(--teal-400)' : 'var(--text-primary)' }}>{p.firstName} {p.lastName}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Prescription view */}
          <div>
            {!selected ? (
              <div className="card" style={{ padding:60, textAlign:'center', color:'var(--text-muted)', height:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
                <User size={40} style={{ opacity:0.15, marginBottom:12 }} />
                <p style={{ fontSize:'0.875rem' }}>Select a patient to view their prescriptions</p>
              </div>
            ) : patientRx.length === 0 ? (
              <div className="card" style={{ padding:40, textAlign:'center', color:'var(--text-muted)' }}>
                <p style={{ marginBottom:12 }}>No prescriptions for {selected.firstName} yet</p>
                <Link to={`/doctor/patients/${selected._id}`}>
                  <button style={{ padding:'8px 18px', borderRadius:'var(--radius-sm)', background:'var(--teal-600)', color:'white', border:'none', cursor:'pointer', fontWeight:600, fontSize:'0.85rem' }}>
                    Go to Patient → Write Prescription
                  </button>
                </Link>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <h3 style={{ fontFamily:'var(--font-display)', fontWeight:600 }}>{selected.firstName} {selected.lastName}</h3>
                  <Link to={`/doctor/patients/${selected._id}`}>
                    <button style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:'var(--radius-sm)', background:'var(--bg-card)', border:'1px solid var(--border)', color:'var(--text-secondary)', fontSize:'0.8rem', cursor:'pointer' }}>
                      Patient Detail <ArrowRight size={12} />
                    </button>
                  </Link>
                </div>
                {patientRx.map((rx, i) => <PrescriptionCard key={rx._id || i} rx={rx} index={i} />)}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
