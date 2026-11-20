// src/pages/auth/RegisterPage.jsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Button, Input, Select } from '../../components/common/UI'
import { Heart, Mail, Lock, User, Phone, ArrowRight, Stethoscope } from 'lucide-react'
import toast from 'react-hot-toast'

const Select2 = ({ label, name, value, onChange, options, required }) => (
  <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
    {label && <label style={{ fontSize:'0.82rem', fontWeight:600, color:'var(--text-secondary)', letterSpacing:'0.02em' }}>{label}{required && <span style={{ color:'var(--rose-400)', marginLeft:2 }}>*</span>}</label>}
    <select name={name} value={value} onChange={onChange} required={required}
      style={{ width:'100%', padding:'10px 14px', background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--radius-md)', color:'var(--text-primary)', fontSize:'0.875rem', fontFamily:'var(--font-body)', outline:'none', transition:'all var(--transition)' }}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
)

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ firstName:'', lastName:'', email:'', phone:'', password:'', confirmPassword:'', role:'patient', specialization:'', licenseNumber:'' })
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)

  const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password !== form.confirmPassword) return toast.error('Passwords do not match')
    if (form.password.length < 8) return toast.error('Password must be at least 8 characters')
    setLoading(true)
    try {
      const { confirmPassword, ...data } = form
      const user = await register(data)
      toast.success('Account created successfully!')
      if (user.role === 'doctor') navigate('/doctor/dashboard')
      else navigate('/patient/dashboard')
    } catch {}
    finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg-primary)', padding:'40px 24px' }}>
      <div style={{ width:'100%', maxWidth:500 }} className="animate-fade">
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:36, justifyContent:'center' }}>
          <div style={{ width:40, height:40, borderRadius:10, background:'linear-gradient(135deg,var(--teal-600),var(--jade-500))', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Heart size={20} color="white" fill="white" />
          </div>
          <span style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:'1.3rem' }}>HealthCore</span>
        </div>

        <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--radius-xl)', padding:'36px 32px' }}>
          <h2 style={{ fontFamily:'var(--font-display)', fontSize:'1.6rem', fontWeight:700, marginBottom:6 }}>Create your account</h2>
          <p style={{ color:'var(--text-secondary)', fontSize:'0.875rem', marginBottom:28 }}>
            Already have an account? <Link to="/login" style={{ color:'var(--teal-400)', fontWeight:600 }}>Sign in</Link>
          </p>

          {/* Progress indicator */}
          <div style={{ display:'flex', gap:8, marginBottom:28 }}>
            {[1,2].map(s => (
              <div key={s} style={{ flex:1, height:4, borderRadius:2, background: step >= s ? 'var(--teal-400)' : 'var(--border)', transition:'background 0.3s' }} />
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:18 }}>
            {step === 1 && <>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                <Input label="First name" name="firstName" placeholder="John" value={form.firstName} onChange={handleChange} icon={User} required />
                <Input label="Last name" name="lastName" placeholder="Doe" value={form.lastName} onChange={handleChange} required />
              </div>
              <Input label="Email address" name="email" type="email" placeholder="you@example.com" value={form.email} onChange={handleChange} icon={Mail} required />
              <Input label="Phone number" name="phone" placeholder="9876543210" value={form.phone} onChange={handleChange} icon={Phone} />
              <Select2 label="I am a" name="role" value={form.role} onChange={handleChange} required
                options={[{ value:'patient', label:'Patient' },{ value:'doctor', label:'Doctor / Physician' }]} />
              {form.role === 'doctor' && <>
                <Input label="Specialization" name="specialization" placeholder="e.g. Cardiologist" value={form.specialization} onChange={handleChange} icon={Stethoscope} />
                <Input label="License Number" name="licenseNumber" placeholder="MCI-XXXXXX" value={form.licenseNumber} onChange={handleChange} />
              </>}
              <Button type="button" fullWidth size="lg" icon={<ArrowRight size={16} />} onClick={() => {
                if (!form.firstName || !form.email) return toast.error('Please fill required fields')
                setStep(2)
              }}>Continue</Button>
            </>}

            {step === 2 && <>
              <Input label="Password" name="password" type="password" placeholder="Min. 8 characters" value={form.password} onChange={handleChange} icon={Lock} required />
              <Input label="Confirm password" name="confirmPassword" type="password" placeholder="Repeat your password" value={form.confirmPassword} onChange={handleChange} icon={Lock} required />

              <div style={{ padding:14, background:'rgba(66,165,245,0.06)', borderRadius:'var(--radius-md)', border:'1px solid rgba(66,165,245,0.15)', fontSize:'0.8rem', color:'var(--text-secondary)', lineHeight:1.7 }}>
                Password must be at least 8 characters and contain uppercase, lowercase, and a number.
              </div>

              <div style={{ display:'flex', gap:12 }}>
                <Button type="button" variant="secondary" fullWidth onClick={() => setStep(1)}>Back</Button>
                <Button type="submit" fullWidth loading={loading} size="lg">Create Account</Button>
              </div>
            </>}
          </form>
        </div>

        {form.role === 'doctor' && (
          <p style={{ marginTop:16, textAlign:'center', fontSize:'0.78rem', color:'var(--text-muted)' }}>
            Doctor accounts require admin approval before access is granted.
          </p>
        )}
      </div>
    </div>
  )
}
