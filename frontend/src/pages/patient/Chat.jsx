// src/pages/patient/Chat.jsx
import { useState, useEffect, useRef } from 'react'
import { chatAPI, patientAPI } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { useSocket } from '../../context/SocketContext'
import { Button } from '../../components/common/UI'
import { Send, MessageSquare, Search, WifiOff, Circle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ChatPage() {
  const { user }           = useAuth()
  const { socket }         = useSocket() || {}
  const [doctors, setDoctors]             = useState([])
  const [messages, setMessages]           = useState([])
  const [selected, setSelected]           = useState(null)
  const [text, setText]                   = useState('')
  const [loadingDocs, setLoadingDocs]     = useState(true)
  const [sending, setSending]             = useState(false)
  const [search, setSearch]               = useState('')
  const [unread, setUnread]               = useState({})   // doctorId → count
  const bottomRef = useRef(null)

  // Load all approved doctors + merge with any existing conversations
  useEffect(() => {
    setLoadingDocs(true)
    Promise.allSettled([
      patientAPI.getDoctors(),          // all approved doctors
      chatAPI.getConversations(),       // doctors already chatted with
    ]).then(([docsRes, convRes]) => {
      const allDocs = docsRes.status === 'fulfilled'
        ? (docsRes.value.data.data || docsRes.value.data || [])
        : []

      const convDocs = convRes.status === 'fulfilled'
        ? (convRes.value.data.data || convRes.value.data || [])
        : []

      // Merge: start with conversation doctors (they have recent activity), then add remaining
      const merged = [...convDocs]
      allDocs.forEach(d => {
        if (!merged.find(m => m._id?.toString() === d._id?.toString())) {
          merged.push(d)
        }
      })
      setDoctors(merged)
    }).finally(() => setLoadingDocs(false))
  }, [])

  useEffect(() => {
    if (!selected) return
    setMessages([])
    chatAPI.getMessages(selected._id?.toString())
      .then(res => {
        setMessages(res.data.data || res.data || [])
        // clear unread for this doctor
        setUnread(u => ({ ...u, [selected._id]: 0 }))
      })
      .catch(() => toast.error('Could not load messages'))
  }, [selected])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (!socket) return
    const handler = (msg) => {
      const senderId = msg.sender?._id?.toString() || msg.sender?.toString()
      const selectedId = selected?._id?.toString()

      if (senderId === selectedId) {
        // Active conversation — append message
        setMessages(p => {
          if (p.find(m => m._id === msg._id)) return p
          return [...p, msg]
        })
        setUnread(u => ({ ...u, [senderId]: 0 }))
      } else {
        // Different doctor — increment unread badge
        setUnread(u => ({ ...u, [senderId]: (u[senderId] || 0) + 1 }))
        // Ensure this doctor appears in list
        setDoctors(prev => {
          if (prev.find(d => d._id?.toString() === senderId)) return prev
          return [{ _id: senderId, firstName: msg.senderName || 'Doctor', lastName: '', specialization: '' }, ...prev]
        })
        toast(`💬 New message from ${msg.senderName || 'a doctor'}`, { duration: 4000 })
      }
    }
    socket.on('receive_message', handler)
    return () => socket.off('receive_message', handler)
  }, [socket, selected])

  const sendMessage = async () => {
    if (!text.trim() || !selected || sending) return
    const receiver = selected._id?.toString()
    if (!receiver) return toast.error('Cannot identify doctor — please reload')
    const content = text.trim()
    setText('')
    setSending(true)
    const optimistic = {
      _id: `opt_${Date.now()}`,
      content,
      sender: user._id,
      receiver,
      createdAt: new Date().toISOString(),
      optimistic: true,
    }
    setMessages(p => [...p, optimistic])
    try {
      const res = await chatAPI.sendMessage({ content, receiver })
      const saved = res.data.data || res.data
      setMessages(p => p.map(m => m._id === optimistic._id ? saved : m))
    } catch {
      setMessages(p => p.filter(m => m._id !== optimistic._id))
      setText(content)
      toast.error('Failed to send message. Please try again.')
    } finally {
      setSending(false)
    }
  }

  const filtered = doctors.filter(c => {
    const name = `${c.firstName || ''} ${c.lastName || ''} ${c.specialization || ''}`.toLowerCase()
    return name.includes(search.toLowerCase())
  })

  return (
    <div style={{ display:'flex', height:'calc(100vh - 120px)', gap:0, borderRadius:'var(--radius-xl)', overflow:'hidden', border:'1px solid var(--border)' }}>
      {/* Sidebar */}
      <div style={{ width:280, flexShrink:0, borderRight:'1px solid var(--border)', background:'var(--bg-card)', display:'flex', flexDirection:'column' }}>
        <div style={{ padding:16, borderBottom:'1px solid var(--border)' }}>
          <p style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:'1rem', marginBottom:12 }}>Doctors</p>
          <div style={{ position:'relative' }}>
            <Search size={14} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search doctors..."
              style={{ width:'100%', padding:'8px 12px 8px 32px', background:'var(--bg-secondary)', border:'1px solid var(--border)', borderRadius:'var(--radius-md)', color:'var(--text-primary)', fontSize:'0.82rem', fontFamily:'var(--font-body)', outline:'none', boxSizing:'border-box' }} />
          </div>
        </div>

        <div style={{ flex:1, overflowY:'auto' }}>
          {loadingDocs ? (
            <div style={{ padding:24, textAlign:'center' }}>
              <div style={{ width:28, height:28, borderRadius:'50%', border:'2px solid var(--border)', borderTopColor:'var(--teal-400)', animation:'spin 0.8s linear infinite', margin:'0 auto 10px' }} />
              <p style={{ fontSize:'0.78rem', color:'var(--text-muted)' }}>Loading…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding:20, textAlign:'center' }}>
              <p style={{ color:'var(--text-muted)', fontSize:'0.82rem' }}>No doctors found</p>
            </div>
          ) : filtered.map((c, i) => {
            const unreadCount = unread[c._id?.toString()] || 0
            return (
              <button key={c._id || i} onClick={() => setSelected(c)}
                style={{ width:'100%', padding:'14px 16px', display:'flex', alignItems:'center', gap:12,
                  background: selected?._id === c._id ? 'rgba(66,165,245,0.1)' : 'transparent',
                  border:'none', borderLeft: selected?._id === c._id ? '3px solid var(--teal-400)' : '3px solid transparent',
                  cursor:'pointer', textAlign:'left', transition:'all var(--transition)' }}>
                <div style={{ position:'relative' }}>
                  <div style={{ width:40, height:40, borderRadius:'50%', background:'linear-gradient(135deg,var(--teal-700),var(--jade-600))', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:'0.9rem', flexShrink:0, color:'white' }}>
                    {c.firstName?.[0]}{c.lastName?.[0]}
                  </div>
                  {unreadCount > 0 && (
                    <span style={{ position:'absolute', top:-4, right:-4, background:'var(--rose-400)', color:'white', borderRadius:'50%', width:18, height:18, fontSize:'0.65rem', fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', border:'2px solid var(--bg-card)' }}>
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight: unreadCount > 0 ? 700 : 600, fontSize:'0.875rem', marginBottom:2 }}>Dr. {c.firstName} {c.lastName}</div>
                  <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.specialization || 'General Practitioner'}</div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Chat area */}
      {!selected ? (
        <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', color:'var(--text-muted)', background:'var(--bg-primary)', gap:16 }}>
          <MessageSquare size={48} style={{ opacity:0.15 }} />
          <div style={{ textAlign:'center' }}>
            <p style={{ fontSize:'0.95rem', fontWeight:600, color:'var(--text-secondary)', marginBottom:6 }}>Select a doctor to start chatting</p>
            <p style={{ fontSize:'0.8rem' }}>All approved doctors are listed in the sidebar</p>
          </div>
        </div>
      ) : (
        <div style={{ flex:1, display:'flex', flexDirection:'column', background:'var(--bg-primary)' }}>
          {/* Header */}
          <div style={{ padding:'14px 20px', borderBottom:'1px solid var(--border)', background:'var(--bg-card)', display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:36, height:36, borderRadius:'50%', background:'linear-gradient(135deg,var(--teal-700),var(--jade-600))', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:'0.85rem', color:'white' }}>
              {selected.firstName?.[0]}{selected.lastName?.[0]}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:600, fontSize:'0.9rem' }}>Dr. {selected.firstName} {selected.lastName}</div>
              <div style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>{selected.specialization || 'General Practitioner'}</div>
            </div>
            {socket?.connected === false && (
              <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:'0.75rem', color:'var(--amber-400)' }}>
                <WifiOff size={13} /> Reconnecting…
              </div>
            )}
            {socket?.connected && (
              <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:'0.72rem', color:'var(--green-400)' }}>
                <Circle size={8} fill="currentColor" /> Online
              </div>
            )}
          </div>

          {/* Messages */}
          <div style={{ flex:1, overflowY:'auto', padding:'16px 20px', display:'flex', flexDirection:'column', gap:12 }}>
            {messages.length === 0 && (
              <p style={{ textAlign:'center', color:'var(--text-muted)', fontSize:'0.82rem', marginTop:40 }}>No messages yet. Start the conversation!</p>
            )}
            {messages.map((m, i) => {
              const mine = m.sender === user._id || m.sender?._id === user._id || m.sender?.toString() === user._id?.toString()
              return (
                <div key={m._id || i} style={{ display:'flex', justifyContent: mine ? 'flex-end' : 'flex-start' }}>
                  <div style={{ maxWidth:'70%', padding:'10px 14px',
                    borderRadius: mine ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    background: mine ? 'linear-gradient(135deg,var(--teal-600),var(--teal-500))' : 'var(--bg-card)',
                    border: mine ? 'none' : '1px solid var(--border)',
                    fontSize:'0.875rem', lineHeight:1.6,
                    opacity: m.optimistic ? 0.7 : 1,
                    transition:'opacity 0.2s' }}>
                    <div>{m.content}</div>
                    <div style={{ fontSize:'0.68rem', opacity:0.6, marginTop:4, textAlign: mine ? 'right' : 'left' }}>
                      {m.optimistic ? 'Sending…' : new Date(m.createdAt).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}
                    </div>
                  </div>
                </div>
              )
            })}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ padding:'12px 16px', borderTop:'1px solid var(--border)', background:'var(--bg-card)', display:'flex', gap:10 }}>
            <input
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
              placeholder="Type a message…"
              style={{ flex:1, padding:'10px 14px', background:'var(--bg-secondary)', border:'1px solid var(--border)', borderRadius:'var(--radius-md)', color:'var(--text-primary)', fontSize:'0.875rem', fontFamily:'var(--font-body)', outline:'none' }}
            />
            <Button onClick={sendMessage} disabled={!text.trim() || sending} loading={sending} icon={<Send size={16} />}>Send</Button>
          </div>
        </div>
      )}
    </div>
  )
}
