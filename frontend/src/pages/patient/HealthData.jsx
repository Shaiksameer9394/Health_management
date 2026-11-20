// src/pages/patient/HealthData.jsx
import { useState, useEffect, useCallback } from 'react'
import { healthAPI } from '../../services/api'
import { Button, Input } from '../../components/common/UI'
import { Activity, Heart, Droplets, Wind, Thermometer, Plus, ChevronDown, ChevronUp, Trash2 } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import toast from 'react-hot-toast'

const METRICS = [
  { key:'heartRate', label:'Heart Rate', unit:'bpm', icon:Heart, color:'var(--rose-400)', min:40, max:220 },
  { key:'bloodGlucose', label:'Blood Glucose', unit:'mg/dL', icon:Droplets, color:'var(--jade-400)', min:60, max:500 },
  { key:'oxygenSaturation', label:'SpO2', unit:'%', icon:Wind, color:'var(--green-400)', min:80, max:100 },
  { key:'temperature', label:'Temperature', unit:'°C', icon:Thermometer, color:'var(--amber-400)', min:35, max:42 },
]

export default function HealthDataPage() {
  const [entries, setEntries] = useState([])
  const [trend, setTrend] = useState([])
  const [selectedMetric, setSelectedMetric] = useState('heartRate')
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ vitals: { heartRate:'', bloodPressure:{ systolic:'', diastolic:'' }, bloodGlucose:'', oxygenSaturation:'', temperature:'' }, weight:'', notes:'' })

  const load = useCallback(async () => {
    try {
      const [entriesRes, trendRes] = await Promise.allSettled([
        healthAPI.getEntries({ limit:20 }),
        healthAPI.getTrends(selectedMetric, 14),
      ])
      if (entriesRes.status === 'fulfilled') setEntries(entriesRes.value.data.data || entriesRes.value.data || [])
      if (trendRes.status === 'fulfilled') setTrend(trendRes.value.data.data || trendRes.value.data || [])
    } catch {}
  }, [selectedMetric])

  useEffect(() => { load() }, [load])

  const handleVitalChange = (key, value) => {
    if (key === 'systolic' || key === 'diastolic') {
      setForm(p => ({ ...p, vitals: { ...p.vitals, bloodPressure: { ...p.vitals.bloodPressure, [key]: value } } }))
    } else {
      setForm(p => ({ ...p, vitals: { ...p.vitals, [key]: value } }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = { vitals: {}, notes: form.notes }
      if (form.vitals.heartRate) payload.vitals.heartRate = Number(form.vitals.heartRate)
      if (form.vitals.bloodGlucose) payload.vitals.bloodGlucose = Number(form.vitals.bloodGlucose)
      if (form.vitals.oxygenSaturation) payload.vitals.oxygenSaturation = Number(form.vitals.oxygenSaturation)
      if (form.vitals.temperature) payload.vitals.temperature = Number(form.vitals.temperature)
      if (form.vitals.bloodPressure.systolic) payload.vitals.bloodPressure = { systolic: Number(form.vitals.bloodPressure.systolic), diastolic: Number(form.vitals.bloodPressure.diastolic) }
      if (form.weight) payload.weight = Number(form.weight)
      await healthAPI.addEntry(payload)
      toast.success('Health data logged!')
      setShowForm(false)
      setForm({ vitals:{ heartRate:'', bloodPressure:{ systolic:'', diastolic:'' }, bloodGlucose:'', oxygenSaturation:'', temperature:'' }, weight:'', notes:'' })
      load()
    } catch {}
    finally { setLoading(false) }
  }

  const deleteEntry = async (id) => {
    try {
      await healthAPI.deleteEntry(id)
      toast.success('Entry deleted')
      load()
    } catch {}
  }

  const metric = METRICS.find(m => m.key === selectedMetric)

  return (
    <div className="animate-fade" style={{ display:'flex', flexDirection:'column', gap:24 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontFamily:'var(--font-display)', fontSize:'1.5rem', fontWeight:700, marginBottom:4 }}>Health Data</h1>
          <p style={{ color:'var(--text-secondary)', fontSize:'0.875rem' }}>Track and monitor your vital signs over time</p>
        </div>
        <Button icon={showForm ? <ChevronUp size={16} /> : <Plus size={16} />} onClick={() => setShowForm(p => !p)}>
          {showForm ? 'Cancel' : 'Log Data'}
        </Button>
      </div>

      {/* Log Form */}
      {showForm && (
        <div className="card" style={{ padding:24 }}>
          <h3 style={{ fontFamily:'var(--font-display)', fontWeight:600, marginBottom:20 }}>New Health Entry</h3>
          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:16 }}>
              <Input label="Heart Rate (bpm)" type="number" placeholder="72" value={form.vitals.heartRate} onChange={e => handleVitalChange('heartRate', e.target.value)} icon={Heart} />
              <Input label="Blood Glucose (mg/dL)" type="number" placeholder="100" value={form.vitals.bloodGlucose} onChange={e => handleVitalChange('bloodGlucose', e.target.value)} icon={Droplets} />
              <Input label="SpO2 (%)" type="number" placeholder="98" value={form.vitals.oxygenSaturation} onChange={e => handleVitalChange('oxygenSaturation', e.target.value)} icon={Wind} />
              <Input label="Temperature (°C)" type="number" step="0.1" placeholder="37.0" value={form.vitals.temperature} onChange={e => handleVitalChange('temperature', e.target.value)} icon={Thermometer} />
              <Input label="Systolic BP" type="number" placeholder="120" value={form.vitals.bloodPressure.systolic} onChange={e => handleVitalChange('systolic', e.target.value)} />
              <Input label="Diastolic BP" type="number" placeholder="80" value={form.vitals.bloodPressure.diastolic} onChange={e => handleVitalChange('diastolic', e.target.value)} />
              <Input label="Weight (kg)" type="number" step="0.1" placeholder="70.0" value={form.weight} onChange={e => setForm(p => ({ ...p, weight: e.target.value }))} />
            </div>
            <div>
              <label style={{ fontSize:'0.82rem', fontWeight:600, color:'var(--text-secondary)', display:'block', marginBottom:6 }}>Notes</label>
              <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="How are you feeling today?"
                style={{ width:'100%', padding:'10px 14px', background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--radius-md)', color:'var(--text-primary)', fontSize:'0.875rem', fontFamily:'var(--font-body)', resize:'vertical', minHeight:80 }} />
            </div>
            <Button type="submit" loading={loading} icon={<Plus size={16} />}>Save Entry</Button>
          </form>
        </div>
      )}

      {/* Trend chart */}
      <div className="card" style={{ padding:24 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12, marginBottom:20 }}>
          <h3 style={{ fontFamily:'var(--font-display)', fontWeight:600 }}>14-Day Trend</h3>
          <div style={{ display:'flex', gap:8 }}>
            {METRICS.map(m => (
              <button key={m.key} onClick={() => setSelectedMetric(m.key)}
                style={{ padding:'6px 12px', borderRadius:'var(--radius-sm)', border:'1px solid', borderColor: selectedMetric === m.key ? m.color : 'var(--border)', background: selectedMetric === m.key ? `${m.color}15` : 'transparent', color: selectedMetric === m.key ? m.color : 'var(--text-muted)', fontSize:'0.75rem', fontWeight:600, cursor:'pointer', transition:'all var(--transition)' }}>
                {m.label.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>
        {trend.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" tick={{ fontSize:11, fill:'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize:11, fill:'var(--text-muted)' }} axisLine={false} tickLine={false} domain={[metric.min, metric.max]} />
              <Tooltip contentStyle={{ background:'var(--teal-900)', border:'1px solid var(--border-accent)', borderRadius:10, fontSize:12 }} formatter={(v) => [`${v} ${metric.unit}`, metric.label]} />
              <Line type="monotone" dataKey="value" stroke={metric.color} strokeWidth={2.5} dot={{ fill: metric.color, r:3 }} activeDot={{ r:5 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ height:200, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-muted)', fontSize:'0.85rem' }}>Log at least 2 entries to see trends</div>
        )}
      </div>

      {/* History */}
      <div className="card" style={{ padding:24 }}>
        <h3 style={{ fontFamily:'var(--font-display)', fontWeight:600, marginBottom:16 }}>History</h3>
        {entries.length === 0 ? (
          <p style={{ color:'var(--text-muted)', textAlign:'center', padding:'24px 0', fontSize:'0.875rem' }}>No entries yet. Start logging your health data!</p>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {entries.map((e, i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:16, padding:'14px 16px', borderRadius:'var(--radius-md)', background:'var(--bg-card-hover)', border:'1px solid var(--border)' }}>
                <div style={{ fontSize:'0.78rem', color:'var(--text-muted)', width:90, flexShrink:0 }}>
                  {new Date(e.recordedAt || e.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'short' })}
                </div>
                <div style={{ display:'flex', flex:1, flexWrap:'wrap', gap:'6px 20px' }}>
                  {e.vitals?.heartRate && <span style={{ fontSize:'0.8rem' }}>❤️ <strong>{e.vitals.heartRate}</strong> bpm</span>}
                  {e.vitals?.bloodPressure?.systolic && <span style={{ fontSize:'0.8rem' }}>🩸 <strong>{e.vitals.bloodPressure.systolic}/{e.vitals.bloodPressure.diastolic}</strong></span>}
                  {e.vitals?.bloodGlucose && <span style={{ fontSize:'0.8rem' }}>💉 <strong>{e.vitals.bloodGlucose}</strong> mg/dL</span>}
                  {e.vitals?.oxygenSaturation && <span style={{ fontSize:'0.8rem' }}>💨 <strong>{e.vitals.oxygenSaturation}</strong>%</span>}
                  {e.vitals?.temperature && <span style={{ fontSize:'0.8rem' }}>🌡️ <strong>{e.vitals.temperature}</strong>°C</span>}
                </div>
                {e.notes && <div style={{ fontSize:'0.78rem', color:'var(--text-secondary)', maxWidth:140, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{e.notes}</div>}
                <button onClick={() => deleteEntry(e._id)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', padding:4 }}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}