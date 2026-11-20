// src/pages/patient/Profile.jsx
import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { patientAPI } from '../../services/api'
import { Button, Input } from '../../components/common/UI'
import { User, Mail, Phone, MapPin, Calendar, Upload, Save, Plus, Trash2, Heart } from 'lucide-react'
import toast from 'react-hot-toast'

export default function PatientProfile() {
  const { user, updateUser } = useAuth()
  const [form, setForm] = useState({ firstName:'', lastName:'', phone:'', address:{ street:'', city:'', state:'', zipCode:'' }, dateOfBirth:'', bloodGroup:'', allergies:[], emergencyContacts:[] })
  const [loading, setLoading] = useState(false)
  const [newAllergy, setNewAllergy] = useState('')

  useEffect(() => {
    if (user?._id) {
      patientAPI.getProfile(user._id).then(res => {
        const d = res.data.data || res.data
        setForm(prev => ({ ...prev, ...d, address: d.address || prev.address, allergies: d.medicalHistory?.allergies || [], emergencyContacts: d.emergencyContacts || [] }))
      }).catch(() => {
        setForm(prev => ({ ...prev, firstName: user.firstName || '', lastName: user.lastName || '', phone: user.phone || '' }))
      })
    }
  }, [user])

  const handleChange = (e) => {
    const { name, value } = e.target
    if (name.startsWith('address.')) {
      const key = name.split('.')[1]
      setForm(p => ({ ...p, address: { ...p.address, [key]: value } }))
    } else {
      setForm(p => ({ ...p, [name]: value }))
    }
  }

  const addAllergy = () => {
    if (!newAllergy.trim()) return
    setForm(p => ({ ...p, allergies: [...p.allergies, newAllergy.trim()] }))
    setNewAllergy('')
  }

  const removeAllergy = (i) => setForm(p => ({ ...p, allergies: p.allergies.filter((_,j) => j !== i) }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await patientAPI.updateProfile(user._id, { ...form, medicalHistory: { allergies: form.allergies } })
      updateUser(res.data.data || res.data)
      toast.success('Profile updated successfully')
    } catch {}
    finally { setLoading(false) }
  }

  return (
    <div className="animate-fade" style={{ display:'flex', flexDirection:'column', gap:24, maxWidth:760 }}>
      <div>
        <h1 style={{ fontFamily:'var(--font-display)', fontSize:'1.5rem', fontWeight:700, marginBottom:4 }}>Profile Settings</h1>
        <p style={{ color:'var(--text-secondary)', fontSize:'0.875rem' }}>Manage your personal information and medical details</p>
      </div>

      {/* Avatar */}
      <div className="card" style={{ padding:24, display:'flex', alignItems:'center', gap:20 }}>
        <div style={{ width:72, height:72, borderRadius:'50%', background:'linear-gradient(135deg,var(--teal-600),var(--jade-500))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.6rem', fontFamily:'var(--font-display)', fontWeight:700, color:'white', flexShrink:0 }}>
          {user?.firstName?.[0]}{user?.lastName?.[0]}
        </div>
        <div>
          <div style={{ fontFamily:'var(--font-display)', fontWeight:600, fontSize:'1.1rem' }}>{user?.firstName} {user?.lastName}</div>
          <div style={{ color:'var(--text-secondary)', fontSize:'0.85rem', marginBottom:10 }}>{user?.email}</div>
          <button style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:'var(--radius-sm)', background:'var(--bg-card-hover)', border:'1px solid var(--border)', color:'var(--text-secondary)', fontSize:'0.8rem', cursor:'pointer' }}>
            <Upload size={12} /> Upload Photo
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:20 }}>
        {/* Basic Info */}
        <div className="card" style={{ padding:24 }}>
          <h3 style={{ fontFamily:'var(--font-display)', fontWeight:600, marginBottom:20, display:'flex', alignItems:'center', gap:8 }}>
            <User size={16} color="var(--teal-400)" /> Personal Information
          </h3>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            <Input label="First name" name="firstName" value={form.firstName} onChange={handleChange} required />
            <Input label="Last name" name="lastName" value={form.lastName} onChange={handleChange} required />
            <Input label="Phone number" name="phone" value={form.phone} onChange={handleChange} icon={Phone} />
            <Input label="Date of birth" name="dateOfBirth" type="date" value={form.dateOfBirth?.split('T')[0] || ''} onChange={handleChange} />
          </div>
          <div style={{ marginTop:16, display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            <Input label="City" name="address.city" value={form.address?.city || ''} onChange={handleChange} icon={MapPin} />
            <Input label="State" name="address.state" value={form.address?.state || ''} onChange={handleChange} />
          </div>
        </div>

        {/* Medical Info */}
        <div className="card" style={{ padding:24 }}>
          <h3 style={{ fontFamily:'var(--font-display)', fontWeight:600, marginBottom:20, display:'flex', alignItems:'center', gap:8 }}>
            <Heart size={16} color="var(--rose-400)" /> Medical Information
          </h3>
          <div style={{ marginBottom:16 }}>
            <label style={{ fontSize:'0.82rem', fontWeight:600, color:'var(--text-secondary)', display:'block', marginBottom:6 }}>Blood Group</label>
            <select name="bloodGroup" value={form.bloodGroup || ''} onChange={handleChange}
              style={{ padding:'10px 14px', background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--radius-md)', color:'var(--text-primary)', fontSize:'0.875rem', fontFamily:'var(--font-body)', width:160 }}>
              <option value="">Select</option>
              {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
            </select>
          </div>

          <label style={{ fontSize:'0.82rem', fontWeight:600, color:'var(--text-secondary)', display:'block', marginBottom:10 }}>Allergies</label>
          <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:10 }}>
            {form.allergies.map((a, i) => (
              <span key={i} style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'4px 12px', background:'rgba(229,57,53,0.1)', border:'1px solid rgba(229,57,53,0.2)', borderRadius:100, fontSize:'0.8rem', color:'var(--rose-400)' }}>
                {a}
                <button type="button" onClick={() => removeAllergy(i)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--rose-400)', display:'flex', padding:0 }}>
                  <Trash2 size={12} />
                </button>
              </span>
            ))}
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <input value={newAllergy} onChange={e => setNewAllergy(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addAllergy())}
              placeholder="Add allergy (press Enter)" style={{ flex:1, padding:'9px 14px', background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--radius-md)', color:'var(--text-primary)', fontSize:'0.875rem', fontFamily:'var(--font-body)' }} />
            <Button type="button" variant="secondary" icon={<Plus size={14} />} onClick={addAllergy}>Add</Button>
          </div>
        </div>

        <Button type="submit" loading={loading} icon={<Save size={16} />} size="lg">Save Changes</Button>
      </form>
    </div>
  )
}
