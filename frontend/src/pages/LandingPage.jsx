// src/pages/LandingPage.jsx
import { useNavigate } from 'react-router-dom'
import { Heart, Activity, Brain, Shield, Users, Zap, ArrowRight, CheckCircle } from 'lucide-react'

export default function LandingPage() {
  const navigate = useNavigate()
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', overflowX: 'hidden' }}>
      {/* Nav */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 40px', borderBottom: '1px solid var(--border)', background: 'var(--bg-glass)', backdropFilter: 'blur(16px)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,var(--teal-600),var(--teal-400))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Heart size={18} color="white" fill="white" />
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem' }}>HealthCore</span>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={() => navigate('/login')} style={{ padding: '8px 20px', borderRadius: 10, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-primary)', cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 600 }}>Login</button>
          <button onClick={() => navigate('/register')} style={{ padding: '8px 20px', borderRadius: 10, background: 'linear-gradient(135deg,var(--teal-600),var(--teal-500))', color: 'white', cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 600, border: 'none', boxShadow: '0 4px 12px rgba(21,101,192,0.3)' }}>Get Started</button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ textAlign: 'center', padding: '100px 40px 80px', position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(21,101,192,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div className="animate-fade">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 14px', borderRadius: 100, background: 'rgba(66,165,245,0.1)', border: '1px solid rgba(66,165,245,0.2)', color: 'var(--teal-400)', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 28 }}>
            <Zap size={12} /> AI-Powered Healthcare
          </span>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2.4rem,6vw,4rem)', fontWeight: 800, lineHeight: 1.1, marginBottom: 24, letterSpacing: '-0.03em' }}>
            Smart Healthcare<br />
            <span className="gradient-text">Management System</span>
          </h1>
          <p style={{ maxWidth: 560, margin: '0 auto 40px', color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: 1.7 }}>
            Monitor health metrics, consult doctors, get AI-powered insights, and manage your complete healthcare journey — all in one place.
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/register')} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 32px', borderRadius: 12, background: 'linear-gradient(135deg,var(--teal-600),var(--teal-500))', color: 'white', cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', border: 'none', boxShadow: '0 8px 24px rgba(21,101,192,0.35)' }}>
              Start Free <ArrowRight size={18} />
            </button>
            <button onClick={() => navigate('/login')} style={{ padding: '14px 32px', borderRadius: 12, background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)', cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem' }}>
              Sign In
            </button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '60px 40px', maxWidth: 1100, margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 700, marginBottom: 48, letterSpacing: '-0.02em' }}>Everything you need for better health</h2>
        <div className="grid-3 stagger">
          {[
            { icon: Activity, color: 'var(--jade-500)', title: 'Health Tracking', desc: 'Log BP, sugar, heart rate, sleep and visualize trends with beautiful charts.' },
            { icon: Brain,    color: 'var(--teal-400)', title: 'AI Insights',     desc: 'Groq AI analyzes your data to predict risks and give personalized suggestions.' },
            { icon: Users,    color: 'var(--amber-500)',title: 'Doctor Connect',  desc: 'Chat with your doctor, share reports and get prescriptions digitally.' },
            { icon: Shield,   color: 'var(--green-400)',title: 'Secure & Private',desc: 'JWT authentication, RBAC and encrypted data storage protect your health info.' },
            { icon: Zap,      color: 'var(--rose-400)', title: 'Emergency SOS',   desc: 'One-tap SOS shares your location and vitals with emergency contacts instantly.' },
            { icon: Heart,    color: 'var(--teal-300)', title: 'Medication Alerts',desc: 'Smart reminders ensure you never miss a dose with real-time notifications.' },
          ].map(({ icon: Icon, color, title, desc }) => (
            <div key={title} className="card" style={{ padding: 24 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: `${color}18`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', color, marginBottom: 16 }}>
                <Icon size={20} />
              </div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 8, fontSize: '1rem' }}>{title}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.6 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '60px 40px', textAlign: 'center' }}>
        <div style={{ maxWidth: 500, margin: '0 auto', padding: 40, background: 'var(--bg-card)', border: '1px solid var(--border-accent)', borderRadius: 24 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 700, marginBottom: 16 }}>Ready to take control of your health?</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: 28, fontSize: '0.9rem' }}>Join thousands of patients and doctors on HealthCore.</p>
          <button onClick={() => navigate('/register')} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 28px', borderRadius: 12, background: 'linear-gradient(135deg,var(--teal-600),var(--teal-500))', color: 'white', cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 700, border: 'none', fontSize: '1rem' }}>
            Create Free Account <ArrowRight size={16} />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ textAlign: 'center', padding: '24px', borderTop: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
        © 2024 HealthCore — Smart Healthcare Management System
      </footer>
    </div>
  )
}
