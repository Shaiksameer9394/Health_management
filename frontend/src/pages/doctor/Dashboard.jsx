// src/pages/doctor/Dashboard.jsx
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { doctorAPI } from '../../services/api'
import { Users, Calendar, Clock, ArrowRight, CheckCircle, Eye, Pill } from 'lucide-react'

const StatCard = ({ icon: Icon, label, value, color, sub }) => (
  <div className="card" style={{ padding:20 }}>
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
      <div style={{ width:40, height:40, borderRadius:10, background:`rgba(${color},0.12)`, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <Icon size={18} color={`rgb(${color})`} />
      </div>
    </div>
    <div style={{ fontFamily:'var(--font-display)', fontSize:'2rem', fontWeight:700, marginBottom:4 }}>{value ?? '—'}</div>
    <div style={{ fontSize:'0.8rem', color:'var(--text-secondary)' }}>{label}</div>
    {sub && <div style={{ fontSize:'0.72rem', color:'var(--text-muted)', marginTop:4 }}>{sub}</div>}
  </div>
)

export default function DoctorDashboard() {
  const { user } = useAuth()
  const [patients, setPatients] = useState([])
  const [appts, setAppts] = useState([])
  const [stats, setStats] = useState({ patientCount:0, prescriptionCount:0, appointmentCount:0 })
  const [loading, setLoading] = useState(true)
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  useEffect(() => {
    Promise.allSettled([
      doctorAPI.getPatients(),
      doctorAPI.getAppointments(),
      doctorAPI.getStats(),
    ]).then(([pRes, aRes, sRes]) => {
      if (pRes.status === 'fulfilled') setPatients(pRes.value.data.data || pRes.value.data || [])
      if (aRes.status === 'fulfilled') setAppts(aRes.value.data.data || aRes.value.data || [])
      if (sRes.status === 'fulfilled') {
        const d = sRes.value.data.data || sRes.value.data || {}
        setStats({ patientCount: d.patientCount || 0, prescriptionCount: d.prescriptionCount || 0, appointmentCount: d.appointmentCount || 0 })
      }
    }).finally(() => setLoading(false))
  }, [])

  const today = new Date().toDateString()
  const todayAppts = appts.filter(a => {
    const d = a.scheduledAt || a.date
    return d && new Date(d).toDateString() === today
  })
  const pending   = appts.filter(a => a.status === 'pending')
  const completed = appts.filter(a => a.status === 'completed')

  const formatTime = (a) => {
    const dt = a.scheduledAt || a.date
    if (!dt) return '—'
    return new Date(dt).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })
  }

  return (
    <div className="animate-fade" style={{ display:'flex', flexDirection:'column', gap:28 }}>
      <div>
        <h1 style={{ fontFamily:'var(--font-display)', fontSize:'1.7rem', fontWeight:700, marginBottom:4 }}>
          {greeting}, Dr. {user?.lastName} 👨‍⚕️
        </h1>
        <p style={{ color:'var(--text-secondary)', fontSize:'0.9rem' }}>
          {new Date().toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
        </p>
      </div>

      {loading ? (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:16 }}>
          {[1,2,3,4,5].map(i => (
            <div key={i} className="card" style={{ padding:20, height:120 }}>
              <div style={{ width:'60%', height:12, borderRadius:6, background:'var(--bg-card-hover)', marginBottom:12 }} />
              <div style={{ width:'40%', height:28, borderRadius:6, background:'var(--bg-card-hover)' }} />
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:16 }} className="stagger">
          <StatCard icon={Users}         label="Total Patients Assigned" value={stats.patientCount}       color="66,165,245"  sub="Assigned to you" />
          <StatCard icon={Eye}           label="My Patients"             value={patients.length}          color="129,199,132" sub="Currently active" />
          <StatCard icon={Pill}          label="Prescriptions Written"   value={stats.prescriptionCount}  color="156,39,176"  sub="All time" />
          <StatCard icon={Calendar}      label="Today's Appointments"    value={todayAppts.length}        color="102,187,106" sub={new Date().toLocaleDateString('en-IN',{day:'numeric',month:'short'})} />
          <StatCard icon={CheckCircle}   label="Completed"               value={completed.length}         color="0,172,193"   sub="All time" />
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
        {/* Today's Schedule */}
        <div className="card" style={{ padding:24 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <h3 style={{ fontFamily:'var(--font-display)', fontWeight:600 }}>Today's Schedule</h3>
            <Link to="/doctor/appointments" style={{ fontSize:'0.82rem', color:'var(--teal-400)' }}>View all →</Link>
          </div>
          {todayAppts.length === 0 ? (
            <p style={{ color:'var(--text-muted)', textAlign:'center', padding:'24px 0', fontSize:'0.875rem' }}>No appointments today</p>
          ) : todayAppts.slice(0,5).map((a, i) => (
            <div key={a._id || i} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 0', borderBottom: i < todayAppts.length-1 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ width:36, height:36, borderRadius:'50%', background:'linear-gradient(135deg,var(--teal-700),var(--jade-600))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.8rem', fontWeight:700, flexShrink:0, color:'white' }}>
                {a.patient?.firstName?.[0]}{a.patient?.lastName?.[0]}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:600, fontSize:'0.875rem' }}>{a.patient?.firstName} {a.patient?.lastName}</div>
                <div style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>{(a.type||'in-person').replace(/_/g,' ')} · {formatTime(a)}</div>
              </div>
              <span className={`badge ${a.status === 'confirmed' ? 'badge-success' : a.status === 'completed' ? 'badge-info' : 'badge-warning'}`}>{a.status}</span>
            </div>
          ))}
        </div>

        {/* Recent Patients */}
        <div className="card" style={{ padding:24 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <h3 style={{ fontFamily:'var(--font-display)', fontWeight:600 }}>My Patients</h3>
            <Link to="/doctor/patients" style={{ fontSize:'0.82rem', color:'var(--teal-400)' }}>View all →</Link>
          </div>
          {patients.length === 0 ? (
            <p style={{ color:'var(--text-muted)', textAlign:'center', padding:'24px 0', fontSize:'0.875rem' }}>No patients assigned yet</p>
          ) : patients.slice(0,5).map((p, i) => (
            <Link key={p._id || i} to={`/doctor/patients/${p._id}`} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 0', borderBottom: i < Math.min(patients.length,5)-1 ? '1px solid var(--border)' : 'none', textDecoration:'none', color:'inherit' }}>
              <div style={{ width:36, height:36, borderRadius:'50%', background:'linear-gradient(135deg,var(--jade-600),var(--teal-600))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.8rem', fontWeight:700, flexShrink:0, color:'white' }}>
                {p.firstName?.[0]}{p.lastName?.[0]}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:600, fontSize:'0.875rem' }}>{p.firstName} {p.lastName}</div>
                <div style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>{p.email}</div>
              </div>
              <ArrowRight size={14} color="var(--text-muted)" />
            </Link>
          ))}
        </div>
      </div>

      {/* Pending appointment requests */}
      {pending.length > 0 && (
        <div className="card" style={{ padding:24, border:'1px solid rgba(255,160,0,0.2)', background:'rgba(255,160,0,0.03)' }}>
          <h3 style={{ fontFamily:'var(--font-display)', fontWeight:600, marginBottom:16, display:'flex', alignItems:'center', gap:8 }}>
            <Clock size={16} color="var(--amber-400)" /> Pending Requests ({pending.length})
          </h3>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {pending.slice(0,3).map((a, i) => {
              const dt = a.scheduledAt || a.date
              return (
                <div key={a._id || i} style={{ display:'flex', alignItems:'center', gap:14, padding:'12px 16px', borderRadius:'var(--radius-md)', background:'var(--bg-card-hover)', border:'1px solid var(--border)' }}>
                  <div style={{ flex:1 }}>
                    <span style={{ fontWeight:600 }}>{a.patient?.firstName} {a.patient?.lastName}</span>
                    <span style={{ color:'var(--text-muted)', fontSize:'0.8rem', marginLeft:8 }}>
                      — {(a.type||'in-person').replace(/_/g,' ')} on {dt ? new Date(dt).toLocaleDateString('en-IN') : '—'} at {formatTime(a)}
                    </span>
                  </div>
                  <Link to="/doctor/appointments">
                    <button style={{ padding:'6px 14px', borderRadius:'var(--radius-sm)', background:'rgba(66,165,245,0.1)', border:'1px solid rgba(66,165,245,0.2)', color:'var(--teal-400)', fontSize:'0.78rem', fontWeight:600, cursor:'pointer' }}>Review</button>
                  </Link>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
