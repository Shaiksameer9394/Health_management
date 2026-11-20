// src/pages/patient/AIInsights.jsx
import { useState, useEffect } from 'react'
import { aiAPI, healthAPI } from '../../services/api'
import { Button } from '../../components/common/UI'
import {
  Brain, Zap, TrendingUp, AlertTriangle, Lightbulb, Shield,
  Search, Pill, FlaskConical, ChevronRight, AlertCircle, BookOpen, RefreshCw,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import toast from 'react-hot-toast'

const PIE_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6']
const BAR_COLOR  = '#14b8a6'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:8, padding:'10px 14px', fontSize:'0.82rem' }}>
      <p style={{ fontWeight:600, marginBottom:4 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || 'var(--teal-400)' }}>{p.name}: <strong>{p.value}{p.unit || ''}</strong></p>
      ))}
    </div>
  )
}

const Badge = ({ children, color = 'var(--teal-400)' }) => (
  <span style={{ padding:'3px 10px', borderRadius:20, background:`${color}22`, color, fontSize:'0.72rem', fontWeight:700, border:`1px solid ${color}44` }}>{children}</span>
)

// ── Medication Research Tab ───────────────────────────────────────────────────
function MedResearchTab() {
  const [query, setQuery]             = useState('')
  const [result, setResult]           = useState(null)
  const [loading, setLoading]         = useState(false)
  const [chatQ, setChatQ]             = useState('')
  const [chatMsgs, setChatMsgs]       = useState([])
  const [chatLoading, setChatLoading] = useState(false)

  const quickSearches = ['Metformin', 'Paracetamol', 'Diabetes', 'Hypertension', 'Amoxicillin', 'Omeprazole']

  const research = async (q) => {
    const term = (q || query).trim()
    if (!term) return toast.error('Enter a medication or disease name')
    setLoading(true)
    setResult(null)
    setChatMsgs([])
    try {
      const res = await aiAPI.medicationResearch(term)
      const data = res.data?.data || res.data
      if (!data) throw new Error('No data returned')
      setResult(data)
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Research failed. Check your Groq API key.')
    } finally { setLoading(false) }
  }

  const askQuestion = async () => {
    if (!chatQ.trim() || !result) return
    const question = chatQ.trim()
    setChatMsgs(p => [...p, { role:'user', content: question }])
    setChatQ('')
    setChatLoading(true)
    try {
      const context = `The patient is asking about "${result.name}". Here is what we know: ${JSON.stringify(result)}`
      const res = await aiAPI.chat([{ role:'user', content: `Context: ${context}\n\nPatient question: ${question}` }])
      const answer = res.data?.data?.message || res.data?.message || 'No response'
      setChatMsgs(p => [...p, { role:'assistant', content: answer }])
    } catch {
      setChatMsgs(p => [...p, { role:'assistant', content: 'Sorry, I could not answer that. Please try again.' }])
    } finally { setChatLoading(false) }
  }

  const dosageData = (result?.dosageGroups || []).map(g => {
    const match = g.dose?.match(/[\d.]+/)
    return {
      name: g.group,
      dose: match ? parseFloat(match[0]) : 0,
      unit: g.dose?.replace(/[\d.]+/, '').trim() || 'mg',
      frequency: g.frequency,
      notes: g.notes,
    }
  })

  const sideEffectData = (result?.sideEffects || []).map(s => ({
    name: s.effect, value: s.percentage || 5, severity: s.severity,
  }))

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      {/* Search box */}
      <div className="card" style={{ padding:24 }}>
        <h3 style={{ fontFamily:'var(--font-display)', fontWeight:600, marginBottom:6, display:'flex', alignItems:'center', gap:8 }}>
          <FlaskConical size={18} color="var(--teal-400)" /> Research Medication or Disease
        </h3>
        <p style={{ color:'var(--text-muted)', fontSize:'0.82rem', marginBottom:16 }}>
          Enter a medication name or disease to get dosage info, side effects charts, and ask AI questions
        </p>
        <div style={{ display:'flex', gap:10 }}>
          <div style={{ flex:1, position:'relative' }}>
            <Search size={15} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)' }} />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && research()}
              placeholder="e.g. Metformin, Paracetamol, Diabetes, Hypertension..."
              style={{ width:'100%', padding:'11px 14px 11px 36px', background:'var(--bg-secondary)', border:'1px solid var(--border)', borderRadius:'var(--radius-md)', color:'var(--text-primary)', fontSize:'0.875rem', fontFamily:'var(--font-body)', outline:'none', boxSizing:'border-box' }}
            />
          </div>
          <Button icon={<Search size={15} />} onClick={() => research()} loading={loading}>Research</Button>
        </div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginTop:14, alignItems:'center' }}>
          <span style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>Quick:</span>
          {quickSearches.map(q => (
            <button key={q} onClick={() => { setQuery(q); research(q) }}
              style={{ padding:'4px 12px', borderRadius:20, border:'1px solid var(--border)', background:'var(--bg-card-hover)', color:'var(--text-secondary)', fontSize:'0.75rem', cursor:'pointer', fontFamily:'var(--font-body)' }}>
              {q}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="card" style={{ padding:48, textAlign:'center' }}>
          <div style={{ width:40, height:40, borderRadius:'50%', border:'3px solid var(--border)', borderTopColor:'var(--teal-400)', animation:'spin 0.8s linear infinite', margin:'0 auto 16px' }} />
          <p style={{ color:'var(--text-muted)', fontSize:'0.875rem' }}>AI is researching "{query}"…</p>
        </div>
      )}

      {!result && !loading && (
        <div className="card" style={{ padding:60, textAlign:'center' }}>
          <Pill size={52} style={{ opacity:0.12, display:'block', margin:'0 auto 20px' }} color="var(--teal-400)" />
          <h3 style={{ fontFamily:'var(--font-display)', fontWeight:600, marginBottom:8, color:'var(--text-secondary)' }}>Research Any Medication or Disease</h3>
          <p style={{ color:'var(--text-muted)', fontSize:'0.875rem', maxWidth:400, margin:'0 auto' }}>
            Search for a medication like "Metformin" or a condition like "Diabetes" to get dosage charts, side effects, warnings, and ask AI questions
          </p>
        </div>
      )}

      {result && !loading && (
        <>
          {/* Header */}
          <div className="card" style={{ padding:24 }}>
            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:12, marginBottom:12 }}>
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
                  <Pill size={20} color="var(--teal-400)" />
                  <h2 style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:'1.3rem' }}>{result.name}</h2>
                  <Badge color={result.type === 'disease' ? 'var(--amber-400)' : 'var(--teal-400)'}>
                    {result.type === 'disease' ? 'Disease' : 'Medication'}
                  </Badge>
                </div>
                <p style={{ color:'var(--text-secondary)', fontSize:'0.875rem', lineHeight:1.7, maxWidth:640 }}>{result.description}</p>
              </div>
            </div>
            {result.warnings?.length > 0 && (
              <div style={{ padding:'12px 16px', borderRadius:'var(--radius-md)', background:'rgba(239,68,68,0.06)', border:'1px solid rgba(239,68,68,0.2)', marginTop:12 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6, color:'var(--rose-400)', fontWeight:700, fontSize:'0.82rem' }}>
                  <AlertCircle size={14} /> WARNINGS
                </div>
                {result.warnings.map((w, i) => (
                  <p key={i} style={{ fontSize:'0.82rem', color:'var(--text-secondary)', lineHeight:1.6 }}>• {w}</p>
                ))}
              </div>
            )}
          </div>

          {/* Charts */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(300px, 1fr))', gap:16 }}>
            {dosageData.length > 0 && (
              <div className="card" style={{ padding:20 }}>
                <h3 style={{ fontFamily:'var(--font-display)', fontWeight:600, marginBottom:4, fontSize:'0.95rem' }}>Dosage by Patient Group</h3>
                <p style={{ color:'var(--text-muted)', fontSize:'0.75rem', marginBottom:16 }}>Standard doses (mg) — always verify with your doctor</p>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={dosageData} margin={{ top:0, right:10, bottom:0, left:-10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="name" tick={{ fill:'var(--text-secondary)', fontSize:11 }} />
                    <YAxis tick={{ fill:'var(--text-secondary)', fontSize:11 }} unit="mg" />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="dose" name="Dose" fill={BAR_COLOR} radius={[6,6,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
                <div style={{ marginTop:14, display:'flex', flexDirection:'column', gap:8 }}>
                  {dosageData.map((d, i) => (
                    <div key={i} style={{ padding:'10px 12px', borderRadius:'var(--radius-sm)', background:'var(--bg-card-hover)', border:'1px solid var(--border)', fontSize:'0.8rem' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:2 }}>
                        <span style={{ fontWeight:600 }}>{d.name}</span>
                        <span style={{ color:'var(--teal-400)', fontWeight:700 }}>{d.dose}mg</span>
                      </div>
                      <div style={{ color:'var(--text-muted)' }}>{d.frequency}</div>
                      {d.notes && <div style={{ color:'var(--text-secondary)', marginTop:3 }}>💡 {d.notes}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {sideEffectData.length > 0 && (
              <div className="card" style={{ padding:20 }}>
                <h3 style={{ fontFamily:'var(--font-display)', fontWeight:600, marginBottom:4, fontSize:'0.95rem' }}>Side Effect Frequency</h3>
                <p style={{ color:'var(--text-muted)', fontSize:'0.75rem', marginBottom:8 }}>Approximate occurrence rates (%)</p>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={sideEffectData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                      {sideEffectData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v) => [`${v}%`, 'Occurrence']} contentStyle={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:8, fontSize:'0.8rem' }} />
                    <Legend iconSize={10} wrapperStyle={{ fontSize:'0.75rem' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ marginTop:10, display:'flex', flexDirection:'column', gap:7 }}>
                  {result.sideEffects?.map((s, i) => (
                    <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:'0.78rem' }}>
                      <span style={{ display:'flex', alignItems:'center', gap:6 }}>
                        <span style={{ width:10, height:10, borderRadius:'50%', background: PIE_COLORS[i % PIE_COLORS.length], flexShrink:0, display:'inline-block' }} />
                        {s.effect}
                      </span>
                      <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                        <Badge color={s.severity==='Rare' ? 'var(--green-400)' : s.severity==='Uncommon' ? 'var(--amber-400)' : 'var(--rose-400)'}>{s.severity}</Badge>
                        <span style={{ color:'var(--text-muted)', minWidth:36, textAlign:'right' }}>{s.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Related info */}
          {(result.relatedMedications?.length > 0 || result.relatedDiseases?.length > 0) && (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(260px, 1fr))', gap:16 }}>
              {result.relatedMedications?.length > 0 && (
                <div className="card" style={{ padding:20 }}>
                  <h4 style={{ fontFamily:'var(--font-display)', fontWeight:600, marginBottom:12, fontSize:'0.9rem', display:'flex', alignItems:'center', gap:6 }}>
                    <Pill size={14} color="var(--teal-400)" /> Related Medications
                  </h4>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                    {result.relatedMedications.map((m, i) => (
                      <button key={i} onClick={() => { setQuery(m); research(m) }}
                        style={{ display:'flex', alignItems:'center', gap:4, padding:'5px 12px', borderRadius:20, border:'1px solid var(--border)', background:'var(--bg-card-hover)', color:'var(--text-secondary)', fontSize:'0.78rem', cursor:'pointer', fontFamily:'var(--font-body)' }}>
                        {m} <ChevronRight size={10} />
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {result.relatedDiseases?.length > 0 && (
                <div className="card" style={{ padding:20 }}>
                  <h4 style={{ fontFamily:'var(--font-display)', fontWeight:600, marginBottom:12, fontSize:'0.9rem', display:'flex', alignItems:'center', gap:6 }}>
                    <BookOpen size={14} color="var(--amber-400)" /> Related Conditions
                  </h4>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                    {result.relatedDiseases.map((d, i) => (
                      <button key={i} onClick={() => { setQuery(d); research(d) }}
                        style={{ display:'flex', alignItems:'center', gap:4, padding:'5px 12px', borderRadius:20, border:'1px solid rgba(234,179,8,0.3)', background:'rgba(234,179,8,0.06)', color:'var(--amber-400)', fontSize:'0.78rem', cursor:'pointer', fontFamily:'var(--font-body)' }}>
                        {d} <ChevronRight size={10} />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* General advice */}
          {(result.generalAdvice || result.whenToSeekHelp) && (
            <div className="card" style={{ padding:20 }}>
              <h4 style={{ fontFamily:'var(--font-display)', fontWeight:600, marginBottom:12, fontSize:'0.9rem' }}>📋 General Advice</h4>
              {result.generalAdvice && (
                <p style={{ fontSize:'0.875rem', color:'var(--text-secondary)', lineHeight:1.7, marginBottom: result.whenToSeekHelp ? 10 : 0 }}>{result.generalAdvice}</p>
              )}
              {result.whenToSeekHelp && (
                <div style={{ padding:'10px 14px', borderRadius:'var(--radius-sm)', background:'rgba(239,68,68,0.06)', border:'1px solid rgba(239,68,68,0.2)', fontSize:'0.82rem', color:'var(--rose-400)', lineHeight:1.6 }}>
                  🚨 {result.whenToSeekHelp}
                </div>
              )}
            </div>
          )}

          {/* Ask AI */}
          <div className="card" style={{ padding:20 }}>
            <h4 style={{ fontFamily:'var(--font-display)', fontWeight:600, marginBottom:4, fontSize:'0.9rem', display:'flex', alignItems:'center', gap:8 }}>
              <Brain size={16} color="var(--teal-400)" /> Ask AI about {result.name}
            </h4>
            <p style={{ color:'var(--text-muted)', fontSize:'0.78rem', marginBottom:14 }}>Ask any question about this medication or condition</p>

            {chatMsgs.length > 0 && (
              <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:14, maxHeight:300, overflowY:'auto', padding:'4px 0' }}>
                {chatMsgs.map((m, i) => (
                  <div key={i} style={{ display:'flex', justifyContent: m.role==='user' ? 'flex-end' : 'flex-start' }}>
                    <div style={{ maxWidth:'80%', padding:'10px 14px',
                      borderRadius: m.role==='user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      background: m.role==='user' ? 'linear-gradient(135deg,var(--teal-600),var(--teal-500))' : 'var(--bg-card-hover)',
                      border: m.role==='user' ? 'none' : '1px solid var(--border)',
                      fontSize:'0.85rem', lineHeight:1.6 }}>
                      {m.content}
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div style={{ display:'flex', justifyContent:'flex-start' }}>
                    <div style={{ padding:'10px 14px', borderRadius:'16px 16px 16px 4px', background:'var(--bg-card-hover)', border:'1px solid var(--border)', fontSize:'0.85rem', color:'var(--text-muted)' }}>
                      AI is thinking…
                    </div>
                  </div>
                )}
              </div>
            )}

            <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:12 }}>
              {[
                `Can I take ${result.name} during pregnancy?`,
                `What foods should I avoid?`,
                `What are overdose symptoms?`,
                `Can I drive after taking it?`,
              ].map((q, i) => (
                <button key={i} onClick={() => setChatQ(q)}
                  style={{ padding:'4px 12px', borderRadius:20, border:'1px solid var(--border)', background:'var(--bg-card-hover)', color:'var(--text-secondary)', fontSize:'0.75rem', cursor:'pointer', fontFamily:'var(--font-body)' }}>
                  {q}
                </button>
              ))}
            </div>

            <div style={{ display:'flex', gap:10 }}>
              <input
                value={chatQ}
                onChange={e => setChatQ(e.target.value)}
                onKeyDown={e => e.key==='Enter' && !e.shiftKey && (e.preventDefault(), askQuestion())}
                placeholder={`Ask anything about ${result.name}…`}
                style={{ flex:1, padding:'10px 14px', background:'var(--bg-secondary)', border:'1px solid var(--border)', borderRadius:'var(--radius-md)', color:'var(--text-primary)', fontSize:'0.875rem', fontFamily:'var(--font-body)', outline:'none' }}
              />
              <Button onClick={askQuestion} disabled={!chatQ.trim() || chatLoading} loading={chatLoading}>Ask AI</Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AIInsightsPage() {
  const [analysis, setAnalysis]           = useState(null)
  const [suggestions, setSuggestions]     = useState([])
  const [risk, setRisk]                   = useState(null)
  const [loading, setLoading]             = useState(false)
  const [suggestionsLoading, setSuggestionsLoading] = useState(false)
  const [activeTab, setActiveTab]         = useState('analysis')
  const [hasHealthData, setHasHealthData] = useState(null)

  useEffect(() => {
    // Check health data exists
    healthAPI.getLatest()
      .then(res => setHasHealthData(!!(res.data?.data || res.data)))
      .catch(() => setHasHealthData(false))

    // Preload suggestions
    loadSuggestions()
  }, [])

  const loadSuggestions = async () => {
    setSuggestionsLoading(true)
    try {
      const res = await aiAPI.getSuggestions()
      const data = res.data?.data || res.data
      setSuggestions(Array.isArray(data) ? data : [])
    } catch {
      setSuggestions([])
    } finally {
      setSuggestionsLoading(false)
    }
  }

  const runAnalysis = async () => {
    setLoading(true)
    try {
      const latestRes = await healthAPI.getLatest()
      const latest = latestRes.data?.data || latestRes.data
      if (!latest) {
        toast.error('Please log health data first before running analysis.')
        setLoading(false)
        return
      }
      const res = await aiAPI.analyzeHealth(latest)
      const data = res.data?.data || res.data
      if (!data) throw new Error('No analysis returned')
      setAnalysis(data)
      setActiveTab('analysis')
      toast.success('Analysis complete!')
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || 'Analysis failed. Check Groq API key.')
    } finally { setLoading(false) }
  }

  const getRiskScore = async () => {
    setLoading(true)
    try {
      const res = await aiAPI.predictRisk()
      const data = res.data?.data || res.data
      if (!data) throw new Error('No risk data returned')
      setRisk(data)
      setActiveTab('risk')
      toast.success('Risk score calculated!')
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || 'Need at least 2 health entries for risk score.')
    } finally { setLoading(false) }
  }

  const riskColor = (s) => (s > 70 ? 'var(--rose-400)' : s > 40 ? 'var(--amber-400)' : 'var(--green-400)')
  const riskLabel = (s) => (s > 70 ? 'High Risk' : s > 40 ? 'Moderate Risk' : 'Low Risk')

  const TABS = [
    ['analysis',    'Analysis'],
    ['risk',        'Risk Score'],
    ['suggestions', 'Suggestions'],
    ['medresearch', 'Medication Research'],
  ]

  return (
    <div className="animate-fade" style={{ display:'flex', flexDirection:'column', gap:24 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontFamily:'var(--font-display)', fontSize:'1.5rem', fontWeight:700, marginBottom:4 }}>AI Health Insights</h1>
          <p style={{ color:'var(--text-secondary)', fontSize:'0.875rem' }}>Powered by Groq AI — analysis, risk scoring & medication research</p>
        </div>
        {activeTab !== 'medresearch' && (
          <div style={{ display:'flex', gap:10 }}>
            <Button variant="secondary" icon={<Zap size={16} />} onClick={getRiskScore} loading={loading} disabled={loading}>Risk Score</Button>
            <Button icon={<Brain size={16} />} onClick={runAnalysis} loading={loading} disabled={loading}>Analyze Now</Button>
          </div>
        )}
      </div>

      {/* No health data warning */}
      {hasHealthData === false && activeTab !== 'medresearch' && (
        <div style={{ padding:'14px 18px', background:'rgba(255,160,0,0.08)', border:'1px solid rgba(255,160,0,0.25)', borderRadius:'var(--radius-md)', display:'flex', alignItems:'center', gap:12 }}>
          <AlertTriangle size={16} color="var(--amber-400)" />
          <span style={{ fontSize:'0.85rem', color:'var(--text-secondary)' }}>
            No health data found. Go to <strong style={{ color:'var(--amber-400)' }}>Health Data → Add Entry</strong> first, then AI features will work.
          </span>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display:'flex', gap:4, background:'var(--bg-card)', padding:4, borderRadius:'var(--radius-md)', border:'1px solid var(--border)', flexWrap:'wrap' }}>
        {TABS.map(([key, label]) => (
          <button key={key} onClick={() => setActiveTab(key)}
            style={{ padding:'7px 18px', borderRadius:8, border:'none',
              background: activeTab===key ? 'var(--teal-600)' : 'transparent',
              color: activeTab===key ? 'white' : 'var(--text-secondary)',
              fontSize:'0.85rem', fontWeight:600, cursor:'pointer', transition:'all var(--transition)',
              display:'flex', alignItems:'center', gap:6 }}>
            {key === 'medresearch' && <Pill size={13} />}
            {label}
          </button>
        ))}
      </div>

      {/* ── Analysis Tab ── */}
      {activeTab === 'analysis' && (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {!analysis ? (
            <div className="card" style={{ padding:60, textAlign:'center' }}>
              <Brain size={52} style={{ opacity:0.15, display:'block', margin:'0 auto 20px' }} color="var(--teal-400)" />
              <h3 style={{ fontFamily:'var(--font-display)', fontWeight:600, marginBottom:8, color:'var(--text-secondary)' }}>No Analysis Yet</h3>
              <p style={{ color:'var(--text-muted)', fontSize:'0.875rem', marginBottom:24 }}>
                Click "Analyze Now" to get a personalized AI health analysis based on your latest vitals
              </p>
              <Button icon={<Brain size={16} />} onClick={runAnalysis} loading={loading}>Run Analysis</Button>
            </div>
          ) : (
            <>
              {/* Overall status banner */}
              <div style={{ padding:20, background:'rgba(66,165,245,0.06)', border:'1px solid rgba(66,165,245,0.15)', borderRadius:'var(--radius-lg)' }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
                  <Brain size={18} color="var(--teal-400)" />
                  <span style={{ fontFamily:'var(--font-display)', fontWeight:600 }}>Overall Assessment</span>
                  {analysis.overallStatus && (
                    <span style={{
                      marginLeft:'auto', padding:'3px 12px', borderRadius:20,
                      background: analysis.overallStatus === 'good' ? 'rgba(102,187,106,0.15)' : analysis.overallStatus === 'concerning' ? 'rgba(239,68,68,0.1)' : 'rgba(66,165,245,0.1)',
                      color: analysis.overallStatus === 'good' ? 'var(--green-400)' : analysis.overallStatus === 'concerning' ? 'var(--rose-400)' : 'var(--teal-400)',
                      fontSize:'0.75rem', fontWeight:700,
                    }}>
                      {analysis.overallStatus.toUpperCase()}
                    </span>
                  )}
                </div>
                <p style={{ color:'var(--text-secondary)', fontSize:'0.9rem', lineHeight:1.8 }}>{analysis.summary || 'Analysis complete.'}</p>
              </div>

              {/* Insights */}
              {Array.isArray(analysis.insights) && analysis.insights.map((insight, i) => (
                <div key={i} className="card" style={{ padding:18, display:'flex', gap:14 }}>
                  <div style={{
                    width:36, height:36, borderRadius:10, flexShrink:0,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    background: insight.type==='warning' ? 'rgba(234,179,8,0.1)' : insight.type==='positive' ? 'rgba(102,187,106,0.1)' : 'rgba(66,165,245,0.1)',
                  }}>
                    {insight.type==='warning'
                      ? <AlertTriangle size={16} color="var(--amber-400)" />
                      : insight.type==='positive'
                      ? <TrendingUp size={16} color="var(--green-400)" />
                      : <Lightbulb size={16} color="var(--teal-400)" />}
                  </div>
                  <div>
                    <div style={{ fontWeight:600, marginBottom:4 }}>{insight.title}</div>
                    <div style={{ fontSize:'0.85rem', color:'var(--text-secondary)', lineHeight:1.7 }}>{insight.message}</div>
                  </div>
                </div>
              ))}

              {/* Recommendations */}
              {Array.isArray(analysis.recommendations) && analysis.recommendations.length > 0 && (
                <div className="card" style={{ padding:20 }}>
                  <h3 style={{ fontFamily:'var(--font-display)', fontWeight:600, marginBottom:14 }}>Recommendations</h3>
                  <ul style={{ display:'flex', flexDirection:'column', gap:8, listStyle:'none', margin:0, padding:0 }}>
                    {analysis.recommendations.map((r, i) => (
                      <li key={i} style={{ fontSize:'0.875rem', color:'var(--text-secondary)', paddingLeft:16, position:'relative', lineHeight:1.7 }}>
                        <span style={{ position:'absolute', left:0, color:'var(--teal-400)' }}>→</span> {r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div style={{ textAlign:'right' }}>
                <button onClick={runAnalysis} disabled={loading}
                  style={{ padding:'7px 16px', borderRadius:'var(--radius-sm)', border:'1px solid var(--border)', background:'none', color:'var(--text-muted)', fontSize:'0.8rem', cursor:'pointer', display:'inline-flex', alignItems:'center', gap:6 }}>
                  <RefreshCw size={13} /> Re-analyze
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Risk Score Tab ── */}
      {activeTab === 'risk' && (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {!risk ? (
            <div className="card" style={{ padding:60, textAlign:'center' }}>
              <Shield size={52} style={{ opacity:0.15, display:'block', margin:'0 auto 20px' }} color="var(--amber-400)" />
              <h3 style={{ fontFamily:'var(--font-display)', fontWeight:600, marginBottom:8, color:'var(--text-secondary)' }}>No Risk Score Yet</h3>
              <p style={{ color:'var(--text-muted)', fontSize:'0.875rem', marginBottom:24 }}>
                Generate a risk assessment based on your health patterns (requires 2+ readings)
              </p>
              <Button icon={<Zap size={16} />} onClick={getRiskScore} loading={loading}>Calculate Risk Score</Button>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div className="card" style={{ padding:32, textAlign:'center' }}>
                <div style={{ fontFamily:'var(--font-display)', fontSize:'4rem', fontWeight:700, color:riskColor(risk.overallRisk||0), marginBottom:8 }}>
                  {risk.overallRisk || 0}
                </div>
                <div style={{ fontSize:'1.1rem', fontWeight:600, color:riskColor(risk.overallRisk||0), marginBottom:8 }}>
                  {riskLabel(risk.overallRisk||0)}
                </div>
                <div style={{ color:'var(--text-muted)', fontSize:'0.85rem', marginBottom: risk.summary ? 16 : 0 }}>
                  Based on your health history and vitals
                </div>
                {risk.summary && (
                  <p style={{ color:'var(--text-secondary)', fontSize:'0.875rem', lineHeight:1.7, maxWidth:500, margin:'0 auto' }}>{risk.summary}</p>
                )}
              </div>

              {Array.isArray(risk.factors) && risk.factors.map((f, i) => (
                <div key={i} className="card" style={{ padding:16, display:'flex', alignItems:'center', gap:16 }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:600, marginBottom:4 }}>{f.name}</div>
                    <div style={{ fontSize:'0.82rem', color:'var(--text-secondary)' }}>{f.description}</div>
                  </div>
                  <div style={{ width:60, height:60, borderRadius:'50%', border:`3px solid ${riskColor(f.score||0)}`, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-display)', fontWeight:700, color:riskColor(f.score||0), fontSize:'1.1rem', flexShrink:0 }}>
                    {f.score || 0}
                  </div>
                </div>
              ))}

              <div style={{ textAlign:'right' }}>
                <button onClick={getRiskScore} disabled={loading}
                  style={{ padding:'7px 16px', borderRadius:'var(--radius-sm)', border:'1px solid var(--border)', background:'none', color:'var(--text-muted)', fontSize:'0.8rem', cursor:'pointer', display:'inline-flex', alignItems:'center', gap:6 }}>
                  <RefreshCw size={13} /> Recalculate
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Suggestions Tab ── */}
      {activeTab === 'suggestions' && (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {/* Header with refresh */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <p style={{ color:'var(--text-secondary)', fontSize:'0.875rem' }}>
              Personalized tips based on your latest health data
            </p>
            <button
              onClick={loadSuggestions}
              disabled={suggestionsLoading}
              style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:'var(--radius-sm)', border:'1px solid var(--border)', background:'none', color:'var(--text-muted)', fontSize:'0.8rem', cursor: suggestionsLoading ? 'not-allowed' : 'pointer' }}>
              <RefreshCw size={13} style={{ animation: suggestionsLoading ? 'spin 0.8s linear infinite' : 'none' }} />
              {suggestionsLoading ? 'Loading…' : 'Refresh'}
            </button>
          </div>

          {suggestionsLoading ? (
            <div className="card" style={{ padding:48, textAlign:'center' }}>
              <div style={{ width:36, height:36, borderRadius:'50%', border:'3px solid var(--border)', borderTopColor:'var(--teal-400)', animation:'spin 0.8s linear infinite', margin:'0 auto 16px' }} />
              <p style={{ color:'var(--text-muted)', fontSize:'0.875rem' }}>AI is generating suggestions…</p>
            </div>
          ) : suggestions.length === 0 ? (
            <div className="card" style={{ padding:48, textAlign:'center' }}>
              <Lightbulb size={48} style={{ opacity:0.15, display:'block', margin:'0 auto 16px' }} color="var(--teal-400)" />
              <h3 style={{ fontFamily:'var(--font-display)', fontWeight:600, marginBottom:8, color:'var(--text-secondary)' }}>No Suggestions Yet</h3>
              <p style={{ color:'var(--text-muted)', fontSize:'0.875rem', marginBottom:24 }}>
                Log health data first, then click Refresh to get personalized AI suggestions
              </p>
              <Button icon={<RefreshCw size={16} />} onClick={loadSuggestions} loading={suggestionsLoading}>
                Get Suggestions
              </Button>
            </div>
          ) : (
            suggestions.map((s, i) => (
              <div key={i} className="card" style={{ padding:18, display:'flex', gap:14, alignItems:'flex-start' }}>
                <span style={{ fontSize:'1.8rem', lineHeight:1, flexShrink:0 }}>{s.emoji || '💡'}</span>
                <div>
                  <div style={{ fontWeight:600, marginBottom:6, fontSize:'0.95rem' }}>{s.title}</div>
                  <div style={{ fontSize:'0.85rem', color:'var(--text-secondary)', lineHeight:1.7 }}>{s.message}</div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Medication Research Tab ── */}
      {activeTab === 'medresearch' && <MedResearchTab />}
    </div>
  )
}