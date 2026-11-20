// src/pages/patient/Dashboard.jsx
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { healthAPI, medicationAPI, appointmentAPI, aiAPI } from '../../services/api'
import { Activity, Heart, Droplets, Wind, Thermometer, Pill, Calendar, Brain, AlertTriangle, TrendingUp, TrendingDown, Minus, ArrowRight } from 'lucide-react'
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis } from 'recharts'

const StatCard = ({ icon: Icon, label, value, unit, trend, color, sub }) => (
  <div className="card" style={{ padding:20, display:'flex', flexDirection:'column', gap:12 }}>
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
      <div style={{ width:38, height:38, borderRadius:10, background:`rgba(${color},0.12)`, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <Icon size={18} color={`rgb(${color})`} />
      </div>
      {trend !== undefined && (
        <span style={{ fontSize:'0.72rem', color: trend > 0 ? 'var(--rose-400)' : trend < 0 ? 'var(--green-400)' : 'var(--text-muted)', display:'flex', alignItems:'center', gap:2 }}>
          {trend > 0 ? <TrendingUp size={12} /> : trend < 0 ? <TrendingDown size={12} /> : <Minus size={12} />}
          {Math.abs(trend)}%
        </span>
      )}
    </div>
    <div>
      <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', marginBottom:4 }}>{label}</div>
      <div style={{ display:'flex', alignItems:'baseline', gap:4 }}>
        <span style={{ fontFamily:'var(--font-display)', fontSize:'1.8rem', fontWeight:700 }}>{value || '—'}</span>
        {unit && <span style={{ fontSize:'0.8rem', color:'var(--text-muted)' }}>{unit}</span>}
      </div>
      {sub && <div style={{ fontSize:'0.72rem', color:'var(--text-secondary)', marginTop:2 }}>{sub}</div>}
    </div>
  </div>
)

export default function PatientDashboard() {
  const { user } = useAuth()
  const [latest, setLatest] = useState(null)
  const [meds, setMeds] = useState([])
  const [appts, setAppts] = useState([])
  const [trend, setTrend] = useState([])
  const [loading, setLoading] = useState(true)
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  useEffect(() => {
    const load = async () => {
      try {
        const [latestRes, medsRes, apptsRes, trendRes] = await Promise.allSettled([
          healthAPI.getLatest(),
          medicationAPI.getToday(),
          appointmentAPI.getAll({ limit:3, status:'confirmed' }),
          healthAPI.getTrends('heartRate', 7),
        ])
        if (latestRes.status === 'fulfilled') setLatest(latestRes.value.data.data || latestRes.value.data)
        if (medsRes.status === 'fulfilled') setMeds(medsRes.value.data.data || medsRes.value.data || [])
        if (apptsRes.status === 'fulfilled') setAppts(apptsRes.value.data.data || apptsRes.value.data || [])
        if (trendRes.status === 'fulfilled') setTrend(trendRes.value.data.data || trendRes.value.data || [])
      } catch {}
      finally { setLoading(false) }
    }
    load()
  }, [])

  const vitals = latest?.vitals || {}
  const takenCount = meds.filter(m => m.takenToday).length

  return (
    <div className="animate-fade" style={{ display:'flex', flexDirection:'column', gap:28 }}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontFamily:'var(--font-display)', fontSize:'1.7rem', fontWeight:700, marginBottom:4 }}>
            {greeting}, {user?.firstName} 👋
          </h1>
          <p style={{ color:'var(--text-secondary)', fontSize:'0.9rem' }}>
            {new Date().toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
          </p>
        </div>
        <Link to="/patient/health-data">
          <button style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'9px 18px', borderRadius:'var(--radius-md)', background:'linear-gradient(135deg,var(--teal-600),var(--teal-500))', color:'white', fontWeight:600, fontSize:'0.875rem', border:'none', cursor:'pointer' }}>
            Log Health Data <ArrowRight size={14} />
          </button>
        </Link>
      </div>

      {/* Vitals grid */}
      <div>
        <h2 style={{ fontFamily:'var(--font-display)', fontWeight:600, color:'var(--text-secondary)', marginBottom:14, textTransform:'uppercase', letterSpacing:'0.06em', fontSize:'0.78rem' }}>Latest Vitals</h2>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:16 }} className="stagger">
          <StatCard icon={Heart} label="Heart Rate" value={vitals.heartRate} unit="bpm" color="229,57,53" trend={2} sub={vitals.heartRate ? (vitals.heartRate < 60 ? 'Low' : vitals.heartRate > 100 ? 'High' : 'Normal') : null} />
          <StatCard icon={Activity} label="Blood Pressure" value={vitals.bloodPressure?.systolic ? `${vitals.bloodPressure.systolic}/${vitals.bloodPressure.diastolic}` : null} unit="mmHg" color="66,165,245" />
          <StatCard icon={Droplets} label="Blood Glucose" value={vitals.bloodGlucose} unit="mg/dL" color="0,172,193" />
          <StatCard icon={Wind} label="SpO2" value={vitals.oxygenSaturation} unit="%" color="102,187,106" trend={-1} />
          <StatCard icon={Thermometer} label="Temperature" value={vitals.temperature} unit="°C" color="255,160,0" />
        </div>
      </div>

      {/* Main content row */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
        {/* Heart rate chart */}
        <div className="card" style={{ padding:24 }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:16 }}>
            <h3 style={{ fontFamily:'var(--font-display)', fontWeight:600 }}>Heart Rate — 7 Days</h3>
            <span className="badge badge-info">bpm</span>
          </div>
          {trend.length > 0 ? (
            <ResponsiveContainer width="100%" height={130}>
              <LineChart data={trend}>
                <XAxis dataKey="date" tick={{ fontSize:10, fill:'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background:'var(--teal-900)', border:'1px solid var(--border-accent)', borderRadius:10, fontSize:12 }} />
                <Line type="monotone" dataKey="value" stroke="var(--rose-400)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height:130, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-muted)', fontSize:'0.85rem' }}>
              No trend data yet. Log your vitals daily!
            </div>
          )}
        </div>

        {/* Today's Medications */}
        <div className="card" style={{ padding:24 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <h3 style={{ fontFamily:'var(--font-display)', fontWeight:600 }}>Today's Medications</h3>
            <span style={{ fontSize:'0.78rem', color:'var(--green-400)' }}>{takenCount}/{meds.length} taken</span>
          </div>
          {meds.length === 0 ? (
            <p style={{ color:'var(--text-muted)', fontSize:'0.85rem', textAlign:'center', padding:'20px 0' }}>No medications scheduled today</p>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {meds.slice(0,4).map((m, i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 12px', borderRadius:'var(--radius-md)', background:'var(--bg-card-hover)', border:'1px solid var(--border)' }}>
                  <Pill size={14} color={m.takenToday ? 'var(--green-400)' : 'var(--text-muted)'} />
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:'0.85rem', fontWeight:600 }}>{m.name}</div>
                    <div style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>{m.dosage} · {m.frequency}</div>
                  </div>
                  {m.takenToday && <span className="badge badge-success">Taken</span>}
                </div>
              ))}
            </div>
          )}
          <Link to="/patient/medications" style={{ display:'block', textAlign:'center', marginTop:14, fontSize:'0.82rem', color:'var(--teal-400)' }}>
            Manage medications →
          </Link>
        </div>
      </div>

      {/* Upcoming Appointments */}
      <div className="card" style={{ padding:24 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          <h3 style={{ fontFamily:'var(--font-display)', fontWeight:600 }}>Upcoming Appointments</h3>
          <Link to="/patient/appointments" style={{ fontSize:'0.82rem', color:'var(--teal-400)' }}>View all →</Link>
        </div>
        {appts.length === 0 ? (
          <div style={{ textAlign:'center', padding:'24px 0', color:'var(--text-muted)' }}>
            <Calendar size={32} style={{ opacity:0.3, marginBottom:8 }} />
            <p style={{ fontSize:'0.85rem' }}>No upcoming appointments</p>
            <Link to="/patient/appointments" style={{ display:'inline-block', marginTop:10, fontSize:'0.82rem', color:'var(--teal-400)' }}>Book now</Link>
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))', gap:12 }}>
            {appts.map((a, i) => (
              <div key={i} style={{ padding:'14px 16px', borderRadius:'var(--radius-md)', background:'var(--bg-card-hover)', border:'1px solid var(--border)' }}>
                <div style={{ fontWeight:600, marginBottom:4 }}>Dr. {a.doctor?.firstName} {a.doctor?.lastName}</div>
                <div style={{ fontSize:'0.8rem', color:'var(--text-secondary)' }}>{a.doctor?.specialization}</div>
                <div style={{ fontSize:'0.78rem', color:'var(--teal-400)', marginTop:8 }}>
                  {new Date(a.date).toLocaleDateString()} · {a.time}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* AI CTA */}
      <div style={{ background:'linear-gradient(135deg, rgba(21,101,192,0.2), rgba(0,172,193,0.15))', border:'1px solid rgba(66,165,245,0.2)', borderRadius:'var(--radius-xl)', padding:24, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:16 }}>
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ width:44, height:44, borderRadius:12, background:'rgba(66,165,245,0.15)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Brain size={22} color="var(--teal-400)" />
          </div>
          <div>
            <div style={{ fontFamily:'var(--font-display)', fontWeight:600, marginBottom:2 }}>AI Health Insights</div>
            <div style={{ fontSize:'0.82rem', color:'var(--text-secondary)' }}>Get personalized analysis of your health trends</div>
          </div>
        </div>
        <Link to="/patient/ai-insights">
          <button style={{ padding:'9px 20px', borderRadius:'var(--radius-md)', background:'rgba(66,165,245,0.15)', border:'1px solid rgba(66,165,245,0.3)', color:'var(--teal-400)', fontWeight:600, fontSize:'0.875rem', cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
            View Insights <ArrowRight size={14} />
          </button>
        </Link>
      </div>
    </div>
  )
}
