// src/pages/auth/ForgotPasswordPage.jsx
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { authAPI } from '../../services/api'
import { Button, Input } from '../../components/common/UI'
import { Heart, Mail, CheckCircle, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email) return toast.error('Please enter your email')
    setLoading(true)
    try {
      await authAPI.forgotPassword(email)
      setSent(true)
    } catch {}
    finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg-primary)', padding:'24px' }}>
      <div style={{ width:'100%', maxWidth:420 }} className="animate-fade">
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:36, justifyContent:'center' }}>
          <Heart size={22} color="var(--teal-400)" fill="var(--teal-400)" />
          <span style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:'1.2rem' }}>HealthCore</span>
        </div>

        <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--radius-xl)', padding:'36px 32px' }}>
          {!sent ? <>
            <div style={{ width:52, height:52, borderRadius:14, background:'rgba(66,165,245,0.1)', border:'1px solid rgba(66,165,245,0.2)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:20 }}>
              <Mail size={24} color="var(--teal-400)" />
            </div>
            <h2 style={{ fontFamily:'var(--font-display)', fontSize:'1.6rem', fontWeight:700, marginBottom:8 }}>Forgot password?</h2>
            <p style={{ color:'var(--text-secondary)', fontSize:'0.875rem', marginBottom:28, lineHeight:1.7 }}>
              No worries. Enter your email and we'll send you a reset link.
            </p>
            <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:20 }}>
              <Input label="Email address" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} icon={Mail} required />
              <Button type="submit" fullWidth loading={loading} size="lg">Send Reset Link</Button>
            </form>
          </> : <>
            <div style={{ width:52, height:52, borderRadius:14, background:'rgba(67,160,71,0.1)', border:'1px solid rgba(67,160,71,0.2)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:20 }}>
              <CheckCircle size={24} color="var(--green-400)" />
            </div>
            <h2 style={{ fontFamily:'var(--font-display)', fontSize:'1.6rem', fontWeight:700, marginBottom:8 }}>Check your email</h2>
            <p style={{ color:'var(--text-secondary)', fontSize:'0.875rem', lineHeight:1.7 }}>
              We've sent a password reset link to <strong style={{ color:'var(--text-primary)' }}>{email}</strong>. Check your inbox and follow the instructions.
            </p>
          </>}
        </div>

        <div style={{ marginTop:20, textAlign:'center' }}>
          <Link to="/login" style={{ display:'inline-flex', alignItems:'center', gap:6, color:'var(--text-secondary)', fontSize:'0.875rem' }}>
            <ArrowLeft size={14} /> Back to sign in
          </Link>
        </div>
      </div>
    </div>
  )
}
