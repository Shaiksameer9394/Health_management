// src/pages/patient/Emergency.jsx
import { useState, useEffect } from 'react'
import { emergencyAPI } from '../../services/api'
import { Button, Input } from '../../components/common/UI'
import { AlertTriangle, Phone, Plus, Trash2, MapPin, Heart, X } from 'lucide-react'
import toast from 'react-hot-toast'

export default function EmergencyPage() {
  const [contacts, setContacts] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [sosSending, setSosSending] = useState(false)
  const [sosCountdown, setSosCountdown] = useState(null)
  const [form, setForm] = useState({ name:'', relationship:'', phone:'', email:'' })

  useEffect(() => {
    emergencyAPI.getContacts().then(res => setContacts(res.data.data || res.data || [])).catch(() => {})
  }, [])

  const addContact = async (e) => {
    e.preventDefault()
    if (!form.name || !form.phone) return toast.error('Name and phone are required')
    try {
      await emergencyAPI.addContact(form)
      toast.success('Contact added')
      setShowForm(false)
      setForm({ name:'', relationship:'', phone:'', email:'' })
      emergencyAPI.getContacts().then(res => setContacts(res.data.data || res.data || []))
    } catch {}
  }

  const triggerSOS = () => {
    setSosCountdown(5)
    const interval = setInterval(() => {
      setSosCountdown(p => {
        if (p <= 1) {
          clearInterval(interval)
          sendSOS()
          return null
        }
        return p - 1
      })
    }, 1000)
  }

  const sendSOS = async () => {
    setSosSending(true)
    try {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (pos) => {
          await emergencyAPI.sendSOS({ lat: pos.coords.latitude, lng: pos.coords.longitude })
          toast.success('🚨 SOS sent to your emergency contacts and doctor!')
          setSosSending(false)
        }, async () => {
          await emergencyAPI.sendSOS({})
          toast.success('🚨 SOS sent!')
          setSosSending(false)
        })
      } else {
        await emergencyAPI.sendSOS({})
        toast.success('🚨 SOS sent!')
        setSosSending(false)
      }
    } catch { setSosSending(false) }
  }

  const cancelSOS = () => setSosCountdown(null)

  return (
    <div className="animate-fade" style={{ display:'flex', flexDirection:'column', gap:24 }}>
      <div>
        <h1 style={{ fontFamily:'var(--font-display)', fontSize:'1.5rem', fontWeight:700, marginBottom:4 }}>Emergency</h1>
        <p style={{ color:'var(--text-secondary)', fontSize:'0.875rem' }}>Quick access to emergency contacts and SOS alerts</p>
      </div>

      {/* SOS Button */}
      <div className="card" style={{ padding:32, textAlign:'center', border:'1px solid rgba(229,57,53,0.2)', background:'rgba(229,57,53,0.03)' }}>
        <div style={{ marginBottom:20 }}>
          <AlertTriangle size={32} color="var(--rose-400)" style={{ marginBottom:12 }} />
          <h2 style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:'1.3rem', marginBottom:8 }}>Emergency SOS</h2>
          <p style={{ color:'var(--text-secondary)', fontSize:'0.875rem', maxWidth:400, margin:'0 auto' }}>
            Sends an alert with your location to all emergency contacts and your assigned doctor.
          </p>
        </div>

        {sosCountdown !== null ? (
          <div>
            <div style={{ fontFamily:'var(--font-display)', fontSize:'3rem', fontWeight:700, color:'var(--rose-400)', marginBottom:8 }}>{sosCountdown}</div>
            <p style={{ color:'var(--text-secondary)', marginBottom:16 }}>Sending SOS in {sosCountdown}s...</p>
            <Button variant="secondary" onClick={cancelSOS}>Cancel</Button>
          </div>
        ) : (
          <button onClick={triggerSOS} disabled={sosSending}
            style={{ width:120, height:120, borderRadius:'50%', background: sosSending ? 'rgba(229,57,53,0.3)' : 'linear-gradient(135deg,var(--rose-600),var(--rose-500))', border:'4px solid rgba(229,57,53,0.3)', color:'white', fontSize:'1.1rem', fontFamily:'var(--font-display)', fontWeight:700, cursor: sosSending ? 'not-allowed' : 'pointer', boxShadow:'0 0 0 8px rgba(229,57,53,0.1)', transition:'all var(--transition)', display:'inline-flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:4 }}>
            <Heart size={24} fill="white" />
            SOS
          </button>
        )}
      </div>

      {/* National Helplines */}
      <div className="card" style={{ padding:24 }}>
        <h3 style={{ fontFamily:'var(--font-display)', fontWeight:600, marginBottom:16 }}>National Emergency Helplines</h3>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:12 }}>
          {[
            { name:'Ambulance', number:'108', color:'var(--rose-400)', emoji:'🚑' },
            { name:'Police', number:'100', color:'var(--teal-400)', emoji:'🚔' },
            { name:'Fire', number:'101', color:'var(--amber-400)', emoji:'🚒' },
            { name:'Disaster', number:'112', color:'var(--jade-400)', emoji:'🆘' },
          ].map(h => (
            <a key={h.name} href={`tel:${h.number}`}
              style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 16px', borderRadius:'var(--radius-md)', background:'var(--bg-card-hover)', border:'1px solid var(--border)', textDecoration:'none', color:'var(--text-primary)', transition:'all var(--transition)' }}>
              <span style={{ fontSize:'1.4rem' }}>{h.emoji}</span>
              <div>
                <div style={{ fontWeight:600, fontSize:'0.85rem' }}>{h.name}</div>
                <div style={{ fontFamily:'var(--font-display)', fontWeight:700, color:h.color, fontSize:'1.1rem' }}>{h.number}</div>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Emergency Contacts */}
      <div className="card" style={{ padding:24 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          <h3 style={{ fontFamily:'var(--font-display)', fontWeight:600 }}>Emergency Contacts</h3>
          <Button size="sm" icon={showForm ? <X size={14} /> : <Plus size={14} />} onClick={() => setShowForm(p => !p)}>
            {showForm ? 'Cancel' : 'Add Contact'}
          </Button>
        </div>

        {showForm && (
          <form onSubmit={addContact} style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:20, padding:20, background:'var(--bg-card-hover)', borderRadius:'var(--radius-md)', border:'1px solid var(--border)' }}>
            <Input label="Name" value={form.name} onChange={e => setForm(p=>({...p,name:e.target.value}))} placeholder="Contact name" required />
            <Input label="Relationship" value={form.relationship} onChange={e => setForm(p=>({...p,relationship:e.target.value}))} placeholder="e.g. Spouse" />
            <Input label="Phone" value={form.phone} onChange={e => setForm(p=>({...p,phone:e.target.value}))} placeholder="10-digit number" icon={Phone} required />
            <Input label="Email (optional)" type="email" value={form.email} onChange={e => setForm(p=>({...p,email:e.target.value}))} placeholder="email@example.com" />
            <div style={{ gridColumn:'1/-1' }}>
              <Button type="submit" icon={<Plus size={14} />}>Add Contact</Button>
            </div>
          </form>
        )}

        {contacts.length === 0 ? (
          <p style={{ color:'var(--text-muted)', textAlign:'center', padding:'20px 0', fontSize:'0.875rem' }}>No emergency contacts added yet</p>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {contacts.map((c, i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 16px', borderRadius:'var(--radius-md)', background:'var(--bg-card-hover)', border:'1px solid var(--border)' }}>
                <div style={{ width:40, height:40, borderRadius:'50%', background:'rgba(66,165,245,0.1)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, flexShrink:0 }}>
                  {c.name[0].toUpperCase()}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:600 }}>{c.name}</div>
                  <div style={{ fontSize:'0.78rem', color:'var(--text-secondary)' }}>{c.relationship}</div>
                </div>
                <a href={`tel:${c.phone}`} style={{ display:'flex', alignItems:'center', gap:6, color:'var(--teal-400)', fontSize:'0.875rem', fontWeight:600 }}>
                  <Phone size={14} /> {c.phone}
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
