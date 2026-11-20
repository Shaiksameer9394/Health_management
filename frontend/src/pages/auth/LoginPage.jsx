// src/pages/auth/LoginPage.jsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Button, Input } from '../../components/common/UI'
import { Heart, Mail, Lock, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.email || !form.password) return toast.error('Please fill all fields')
    setLoading(true)
    try {
      const user = await login(form.email, form.password)
      toast.success(`Welcome back, ${user.firstName}!`)
      if (user.role === 'doctor') navigate('/doctor/dashboard')
      else if (user.role === 'admin') navigate('/admin/dashboard')
      else navigate('/patient/dashboard')
    } catch {}
    finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg-primary)' }}>
      {/* Left decorative panel */}
      <div className="auth-left" style={{
        flex: 1, flexDirection: 'column', justifyContent: 'center', padding: '60px',
        background: 'linear-gradient(145deg, var(--teal-900), var(--teal-950))',
        borderRight: '1px solid var(--border)'
      }}>
        <div style={{ maxWidth: 440 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:48 }}>
            <div style={{ width:44, height:44, borderRadius:12, background:'linear-gradient(135deg,var(--teal-600),var(--jade-500))', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Heart size={22} color="white" fill="white" />
            </div>
            <span style={{ fontFamily:'var(--font-display)', fontSize:'1.4rem', fontWeight:700 }}>HealthCore</span>
          </div>
          <h1 style={{ fontFamily:'var(--font-display)', fontSize:'2.4rem', fontWeight:700, lineHeight:1.2, marginBottom:20 }}>
            Your health,<br /><span className="gradient-text">intelligently managed.</span>
          </h1>
          <p style={{ color:'var(--text-secondary)', lineHeight:1.8, marginBottom:40 }}>
            AI-powered health monitoring, real-time doctor communication, and personalized insights — all in one secure platform.
          </p>
          {[['🩺','Real-time health monitoring & AI analysis'],['💊','Smart medication reminders & tracking'],['🔒','HIPAA-compliant secure data storage']].map(([icon,text],i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
              <span style={{ fontSize:'1.3rem' }}>{icon}</span>
              <span style={{ color:'var(--text-secondary)', fontSize:'0.9rem' }}>{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right form panel */}
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:'40px 24px' }}>
        <div style={{ width:'100%', maxWidth:420 }} className="animate-fade">
          <div className="mobile-logo" style={{ display:'flex', alignItems:'center', gap:10, marginBottom:40, justifyContent:'center' }}>
            <Heart size={22} color="var(--teal-400)" fill="var(--teal-400)" />
            <span style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:'1.2rem' }}>HealthCore</span>
          </div>
          <h2 style={{ fontFamily:'var(--font-display)', fontSize:'1.8rem', fontWeight:700, marginBottom:8 }}>Sign in</h2>
          <p style={{ color:'var(--text-secondary)', fontSize:'0.9rem', marginBottom:36 }}>
            Don't have an account? <Link to="/register" style={{ color:'var(--teal-400)', fontWeight:600 }}>Create one</Link>
          </p>
          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:20 }}>
            <Input label="Email address" name="email" type="email" placeholder="you@example.com" value={form.email} onChange={handleChange} icon={Mail} required autoComplete="email" />
            <Input label="Password" name="password" type="password" placeholder="Enter your password" value={form.password} onChange={handleChange} icon={Lock} required autoComplete="current-password" />
            <div style={{ display:'flex', justifyContent:'flex-end' }}>
              <Link to="/forgot-password" style={{ fontSize:'0.82rem', color:'var(--text-secondary)' }}>Forgot password?</Link>
            </div>
            <Button type="submit" fullWidth loading={loading} size="lg" icon={<ArrowRight size={16} />}>Sign in</Button>
          </form>

          <div style={{ marginTop:32, padding:16, background:'var(--bg-card)', borderRadius:'var(--radius-md)', border:'1px solid var(--border)' }}>
            <p style={{ fontSize:'0.75rem', color:'var(--text-muted)', textAlign:'center', marginBottom:10 }}>Demo accounts (password: Demo@1234)</p>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
              {[['Patient','patient@demo.com'],['Doctor','doctor@demo.com'],['Admin','admin@demo.com']].map(([role,email]) => (
                <button key={role} onClick={() => setForm({ email, password:'Demo@1234' })}
                  style={{ padding:'8px 4px', borderRadius:'var(--radius-sm)', background:'var(--bg-card-hover)', border:'1px solid var(--border)', color:'var(--text-secondary)', fontSize:'0.72rem', cursor:'pointer', transition:'all var(--transition)' }}>
                  {role}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      <style>{`.auth-left{display:flex!important}@media(max-width:1023px){.auth-left{display:none!important}}.mobile-logo{display:none!important}@media(max-width:1023px){.mobile-logo{display:flex!important}}`}</style>
    </div>
  )
}
