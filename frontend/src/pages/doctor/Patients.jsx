// src/pages/doctor/Patients.jsx
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { doctorAPI } from '../../services/api'
import { Users, Search, ArrowRight, Activity, Calendar } from 'lucide-react'

export default function DoctorPatients() {
  const [patients, setPatients] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    doctorAPI.getPatients()
      .then(res => setPatients(res.data.data || res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = patients.filter(p => {
    const name = `${p.firstName} ${p.lastName} ${p.email}`.toLowerCase()
    return name.includes(search.toLowerCase())
  })

  return (
    <div className="animate-fade" style={{ display:'flex', flexDirection:'column', gap:24 }}>
      <div>
        <h1 style={{ fontFamily:'var(--font-display)', fontSize:'1.5rem', fontWeight:700, marginBottom:4 }}>My Patients</h1>
        <p style={{ color:'var(--text-secondary)', fontSize:'0.875rem' }}>{patients.length} patient{patients.length !== 1 ? 's' : ''} under your care</p>
      </div>

      {/* Search */}
      <div style={{ position:'relative', maxWidth:400 }}>
        <Search size={15} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)' }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search patients..."
          style={{ width:'100%', padding:'10px 14px 10px 38px', background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--radius-md)', color:'var(--text-primary)', fontSize:'0.875rem', fontFamily:'var(--font-body)', outline:'none' }} />
      </div>

      {loading ? (
        <div style={{ textAlign:'center', padding:40, color:'var(--text-muted)' }}>Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ padding:60, textAlign:'center', color:'var(--text-muted)' }}>
          <Users size={48} style={{ opacity:0.2, marginBottom:16 }} />
          <p style={{ fontSize:'0.875rem' }}>{search ? 'No patients found' : 'No patients assigned yet'}</p>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:16 }}>
          {filtered.map((p, i) => (
            <Link key={i} to={`/doctor/patients/${p._id}`} style={{ textDecoration:'none', color:'inherit' }}>
              <div className="card" style={{ padding:20, cursor:'pointer' }}>
                <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:16 }}>
                  <div style={{ width:48, height:48, borderRadius:'50%', background:'linear-gradient(135deg,var(--teal-700),var(--jade-600))', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-display)', fontWeight:700, fontSize:'1rem', flexShrink:0 }}>
                    {p.firstName?.[0]}{p.lastName?.[0]}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:600, fontSize:'0.95rem' }}>{p.firstName} {p.lastName}</div>
                    <div style={{ fontSize:'0.78rem', color:'var(--text-secondary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.email}</div>
                  </div>
                  <ArrowRight size={16} color="var(--text-muted)" />
                </div>
                <div style={{ display:'flex', gap:16, paddingTop:12, borderTop:'1px solid var(--border)' }}>
                  {p.phone && <div style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>📞 {p.phone}</div>}
                  {p.medicalHistory?.bloodGroup && <div style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>🩸 {p.medicalHistory.bloodGroup}</div>}
                  {p.age && <div style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>Age: {p.age}</div>}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
