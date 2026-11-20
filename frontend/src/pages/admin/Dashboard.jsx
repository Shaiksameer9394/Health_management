// src/pages/admin/Dashboard.jsx
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { adminAPI } from '../../services/api'
import { Users, UserCheck, Activity, ShieldCheck, TrendingUp, AlertCircle, FileText, MessageSquare, Pill, RefreshCw } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

const StatCard = ({ icon: Icon, label, value, color, link, sub }) => (
  <div className="card" style={{ padding:22 }}>
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
      <div style={{ width:42, height:42, borderRadius:12, background:`rgba(${color},0.12)`, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <Icon size={20} color={`rgb(${color})`} />
      </div>
      {link && <Link to={link} style={{ fontSize:'0.75rem', color:'var(--teal-400)' }}>View →</Link>}
    </div>
    <div style={{ fontFamily:'var(--font-display)', fontSize:'2.2rem', fontWeight:700, marginBottom:4 }}>{value ?? '—'}</div>
    <div style={{ fontSize:'0.82rem', color:'var(--text-secondary)' }}>{label}</div>
    {sub && <div style={{ fontSize:'0.72rem', color:'var(--text-muted)', marginTop:4 }}>{sub}</div>}
  </div>
)

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadStats = () => {
    setRefreshing(true)
    adminAPI.getStats()
      .then(res => setStats(res.data.data || res.data))
      .catch(err => console.error('Admin stats failed:', err))
      .finally(() => { setLoading(false); setRefreshing(false) })
  }

  useEffect(() => { loadStats() }, [])

  const chartData = stats?.monthlyGrowth || [
    { month:'Oct', patients:12, doctors:2 },
    { month:'Nov', patients:19, doctors:3 },
    { month:'Dec', patients:28, doctors:4 },
    { month:'Jan', patients:35, doctors:6 },
    { month:'Feb', patients:47, doctors:7 },
    { month:'Mar', patients:stats?.totalPatients || 54, doctors:stats?.totalDoctors || 9 },
  ]

  return (
    <div className="animate-fade" style={{ display:'flex', flexDirection:'column', gap:28 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontFamily:'var(--font-display)', fontSize:'1.7rem', fontWeight:700, marginBottom:4 }}>Admin Dashboard</h1>
          <p style={{ color:'var(--text-secondary)', fontSize:'0.9rem' }}>Platform overview and management</p>
        </div>
        <button onClick={loadStats} disabled={refreshing}
          style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', borderRadius:'var(--radius-md)', border:'1px solid var(--border)', background:'var(--bg-card)', color:'var(--text-secondary)', fontSize:'0.82rem', cursor: refreshing ? 'not-allowed' : 'pointer' }}>
          <RefreshCw size={13} style={{ animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }} />
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:16 }} className="stagger">
        <StatCard icon={Users} label="Total Patients" value={stats?.totalPatients} color="66,165,245" link="/admin/users" />
        <StatCard icon={UserCheck} label="Active Doctors" value={stats?.totalDoctors} color="102,187,106" link="/admin/users" />
        <StatCard icon={ShieldCheck} label="Pending Approvals" value={stats?.pendingDoctors} color="255,160,0" link="/admin/approvals" sub="Doctors awaiting review" />
        <StatCard icon={Activity} label="Total Appointments" value={stats?.totalAppointments} color="0,172,193" />
        <StatCard icon={FileText} label="Reports Uploaded" value={stats?.totalReports} color="171,71,188" />
        <StatCard icon={MessageSquare} label="Messages Sent" value={stats?.totalMessages} color="38,166,154" />
        <StatCard icon={Pill} label="Active Medications" value={stats?.totalMedications} color="255,112,67" />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:20 }}>
        {/* Growth chart */}
        <div className="card" style={{ padding:24 }}>
          <h3 style={{ fontFamily:'var(--font-display)', fontWeight:600, marginBottom:20 }}>Platform Growth (6 months)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize:11, fill:'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize:11, fill:'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background:'var(--teal-900)', border:'1px solid var(--border-accent)', borderRadius:10, fontSize:12 }} />
              <Bar dataKey="patients" fill="rgba(66,165,245,0.7)" radius={[4,4,0,0]} name="Patients" />
              <Bar dataKey="doctors" fill="rgba(102,187,106,0.7)" radius={[4,4,0,0]} name="Doctors" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Quick Actions */}
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {stats?.pendingDoctors > 0 && (
            <div style={{ padding:20, background:'rgba(255,160,0,0.06)', border:'1px solid rgba(255,160,0,0.2)', borderRadius:'var(--radius-lg)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                <AlertCircle size={16} color="var(--amber-400)" />
                <span style={{ fontWeight:600, fontSize:'0.9rem' }}>Action Required</span>
              </div>
              <p style={{ fontSize:'0.82rem', color:'var(--text-secondary)', marginBottom:12 }}>
                {stats.pendingDoctors} doctor account{stats.pendingDoctors>1?'s':''} awaiting approval
              </p>
              <Link to="/admin/approvals">
                <button style={{ width:'100%', padding:'8px 14px', borderRadius:'var(--radius-sm)', background:'rgba(255,160,0,0.15)', border:'1px solid rgba(255,160,0,0.3)', color:'var(--amber-400)', fontWeight:600, fontSize:'0.82rem', cursor:'pointer' }}>
                  Review Applications →
                </button>
              </Link>
            </div>
          )}

          <div className="card" style={{ padding:20 }}>
            <h3 style={{ fontFamily:'var(--font-display)', fontWeight:600, marginBottom:14, fontSize:'0.95rem' }}>Quick Links</h3>
            {[
              { label:'Manage Users', path:'/admin/users', icon:'👥' },
              { label:'Doctor Approvals', path:'/admin/approvals', icon:'✅' },
            ].map(l => (
              <Link key={l.path} to={l.path} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 0', borderBottom:'1px solid var(--border)', textDecoration:'none', color:'var(--text-primary)', fontSize:'0.875rem' }}>
                <span>{l.icon}</span> {l.label}
              </Link>
            ))}
          </div>

          <div className="card" style={{ padding:20 }}>
            <h3 style={{ fontFamily:'var(--font-display)', fontWeight:600, marginBottom:12, fontSize:'0.95rem' }}>Platform Stats</h3>
            <div style={{ display:'flex', flexDirection:'column', gap:8, fontSize:'0.82rem' }}>
              <div style={{ display:'flex', justifyContent:'space-between' }}><span style={{ color:'var(--text-secondary)' }}>Health entries logged</span><strong>{stats?.totalHealthEntries ?? '—'}</strong></div>
              <div style={{ display:'flex', justifyContent:'space-between' }}><span style={{ color:'var(--text-secondary)' }}>Messages sent</span><strong>{stats?.totalMessages ?? '—'}</strong></div>
              <div style={{ display:'flex', justifyContent:'space-between' }}><span style={{ color:'var(--text-secondary)' }}>Reports uploaded</span><strong>{stats?.totalReports ?? '—'}</strong></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}