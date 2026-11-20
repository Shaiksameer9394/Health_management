// src/pages/admin/Users.jsx
import { useState, useEffect } from 'react'
import { adminAPI } from '../../services/api'
import { Users, Search, Shield, User, Stethoscope, Trash2, Ban, CheckCircle, UserCheck } from 'lucide-react'
import toast from 'react-hot-toast'

const ROLE_ICON  = { patient: User, doctor: Stethoscope, admin: Shield }
const ROLE_COLOR = { patient:'66,165,245', doctor:'102,187,106', admin:'255,160,0' }

export default function AdminUsers() {
  const [users, setUsers]         = useState([])
  const [doctors, setDoctors]     = useState([])   // approved doctors list for dropdown
  const [search, setSearch]       = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [loading, setLoading]     = useState(true)
  const [page, setPage]           = useState(1)
  const [assigning, setAssigning] = useState({})   // patientId → true while saving

  // Load users (filtered)
  const load = () => {
    setLoading(true)
    adminAPI.getUsers({ search, role: roleFilter === 'all' ? undefined : roleFilter, page, limit: 20 })
      .then(res => setUsers(res.data.data || res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [search, roleFilter, page])

  // Load all approved doctors once (for assign dropdown)
  useEffect(() => {
    adminAPI.getUsers({ role: 'doctor', limit: 100 })
      .then(res => {
        const all = res.data.data || res.data || []
        setDoctors(all.filter(d => d.isApproved !== false))
      })
      .catch(() => {})
  }, [])

  const toggleActive = async (id, current) => {
    try {
      await adminAPI.updateUser(id, { isActive: !current })
      toast.success(current ? 'User deactivated' : 'User activated')
      load()
    } catch { toast.error('Failed to update user') }
  }

  const deleteUser = async (id) => {
    if (!window.confirm('Permanently delete this user? This cannot be undone.')) return
    try {
      await adminAPI.deleteUser(id)
      toast.success('User deleted')
      load()
    } catch { toast.error('Failed to delete user') }
  }

  const assignDoctor = async (patientId, doctorId) => {
    setAssigning(a => ({ ...a, [patientId]: true }))
    try {
      await adminAPI.assignPatientToDoctor(patientId, doctorId || null)
      toast.success(doctorId ? 'Doctor assigned successfully' : 'Doctor unassigned')
      // Update local state so dropdown reflects change without full reload
      setUsers(prev => prev.map(u =>
        u._id === patientId ? { ...u, assignedDoctor: doctorId || null } : u
      ))
    } catch {
      toast.error('Failed to assign doctor')
    } finally {
      setAssigning(a => ({ ...a, [patientId]: false }))
    }
  }

  return (
    <div className="animate-fade" style={{ display:'flex', flexDirection:'column', gap:24 }}>
      <div>
        <h1 style={{ fontFamily:'var(--font-display)', fontSize:'1.5rem', fontWeight:700, marginBottom:4 }}>User Management</h1>
        <p style={{ color:'var(--text-secondary)', fontSize:'0.875rem' }}>Manage all platform users and assign doctors to patients</p>
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
        <div style={{ position:'relative', flex:1, minWidth:200 }}>
          <Search size={14} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)' }} />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search by name or email..."
            style={{ width:'100%', padding:'10px 14px 10px 36px', background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--radius-md)', color:'var(--text-primary)', fontSize:'0.875rem', fontFamily:'var(--font-body)', outline:'none' }}
          />
        </div>
        <div style={{ display:'flex', gap:8 }}>
          {['all','patient','doctor','admin'].map(r => (
            <button key={r} onClick={() => { setRoleFilter(r); setPage(1) }}
              style={{
                padding:'6px 16px', borderRadius:'var(--radius-sm)', border:'1px solid',
                borderColor: roleFilter===r ? 'var(--teal-400)' : 'var(--border)',
                background:  roleFilter===r ? 'rgba(66,165,245,0.1)' : 'transparent',
                color:       roleFilter===r ? 'var(--teal-400)' : 'var(--text-muted)',
                fontSize:'0.8rem', fontWeight:600, cursor:'pointer', textTransform:'capitalize', transition:'all var(--transition)'
              }}>
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ overflow:'hidden' }}>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ borderBottom:'1px solid var(--border)', background:'var(--bg-card-hover)' }}>
                {['User', 'Role', 'Status', 'Assigned Doctor', 'Joined', 'Actions'].map(h => (
                  <th key={h} style={{ padding:'12px 16px', textAlign:'left', fontSize:'0.75rem', fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em', whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ padding:40, textAlign:'center', color:'var(--text-muted)' }}>Loading…</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={6} style={{ padding:40, textAlign:'center', color:'var(--text-muted)' }}>No users found</td></tr>
              ) : users.map((u, i) => {
                const Icon  = ROLE_ICON[u.role]  || User
                const color = ROLE_COLOR[u.role] || '150,150,150'
                const isPatient = u.role === 'patient'

                // Find currently assigned doctor name
                const assignedDoc = doctors.find(d => d._id === u.assignedDoctor || d._id === u.assignedDoctor?._id)

                return (
                  <tr
                    key={u._id || i}
                    style={{ borderBottom:'1px solid var(--border)', transition:'background var(--transition)' }}
                    onMouseEnter={e => e.currentTarget.style.background='var(--bg-card-hover)'}
                    onMouseLeave={e => e.currentTarget.style.background='transparent'}
                  >
                    {/* User info */}
                    <td style={{ padding:'14px 16px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div style={{ width:36, height:36, borderRadius:'50%', background:`rgba(${color},0.12)`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                          <span style={{ fontWeight:700, fontSize:'0.85rem', color:`rgb(${color})` }}>{u.firstName?.[0]}{u.lastName?.[0]}</span>
                        </div>
                        <div>
                          <div style={{ fontWeight:600, fontSize:'0.875rem' }}>{u.firstName} {u.lastName}</div>
                          <div style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>{u.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td style={{ padding:'14px 16px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                        <Icon size={13} color={`rgb(${color})`} />
                        <span style={{ fontSize:'0.82rem', textTransform:'capitalize', color:`rgb(${color})`, fontWeight:600 }}>{u.role}</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td style={{ padding:'14px 16px' }}>
                      <span className={`badge ${u.isActive !== false ? 'badge-success' : 'badge-danger'}`}>
                        {u.isActive !== false ? 'Active' : 'Inactive'}
                      </span>
                    </td>

                    {/* Assign Doctor (patients only) */}
                    <td style={{ padding:'14px 16px', minWidth:180 }}>
                      {isPatient ? (
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <UserCheck size={13} color="var(--teal-400)" style={{ flexShrink:0 }} />
                          <select
                            value={u.assignedDoctor?._id || u.assignedDoctor || ''}
                            disabled={assigning[u._id]}
                            onChange={e => assignDoctor(u._id, e.target.value)}
                            style={{
                              fontSize:'0.78rem', padding:'5px 8px',
                              borderRadius:'var(--radius-sm)',
                              background:'var(--bg-secondary)',
                              border:'1px solid var(--border)',
                              color: u.assignedDoctor ? 'var(--teal-400)' : 'var(--text-muted)',
                              cursor: assigning[u._id] ? 'not-allowed' : 'pointer',
                              outline:'none', maxWidth:160,
                            }}
                          >
                            <option value="">-- Unassigned --</option>
                            {doctors.map(d => (
                              <option key={d._id} value={d._id}>
                                Dr. {d.firstName} {d.lastName}
                              </option>
                            ))}
                          </select>
                          {assigning[u._id] && (
                            <div style={{ width:12, height:12, borderRadius:'50%', border:'2px solid var(--border)', borderTopColor:'var(--teal-400)', animation:'spin 0.8s linear infinite', flexShrink:0 }} />
                          )}
                        </div>
                      ) : (
                        <span style={{ fontSize:'0.78rem', color:'var(--text-muted)' }}>—</span>
                      )}
                    </td>

                    {/* Joined */}
                    <td style={{ padding:'14px 16px', fontSize:'0.82rem', color:'var(--text-muted)', whiteSpace:'nowrap' }}>
                      {new Date(u.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}
                    </td>

                    {/* Actions */}
                    <td style={{ padding:'14px 16px' }}>
                      <div style={{ display:'flex', gap:8 }}>
                        <button
                          onClick={() => toggleActive(u._id, u.isActive !== false)}
                          title={u.isActive !== false ? 'Deactivate' : 'Activate'}
                          style={{
                            padding:'5px 8px', borderRadius:'var(--radius-sm)',
                            background:   u.isActive !== false ? 'rgba(229,57,53,0.08)' : 'rgba(67,160,71,0.08)',
                            border:'1px solid',
                            borderColor:  u.isActive !== false ? 'rgba(229,57,53,0.2)' : 'rgba(67,160,71,0.2)',
                            color:        u.isActive !== false ? 'var(--rose-400)' : 'var(--green-400)',
                            cursor:'pointer',
                          }}>
                          {u.isActive !== false ? <Ban size={13} /> : <CheckCircle size={13} />}
                        </button>
                        <button
                          onClick={() => deleteUser(u._id)}
                          title="Delete user"
                          style={{ padding:'5px 8px', borderRadius:'var(--radius-sm)', background:'rgba(229,57,53,0.08)', border:'1px solid rgba(229,57,53,0.2)', color:'var(--rose-400)', cursor:'pointer' }}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {users.length === 20 || page > 1 ? (
          <div style={{ display:'flex', justifyContent:'center', gap:12, padding:'16px', borderTop:'1px solid var(--border)' }}>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{ padding:'6px 16px', borderRadius:'var(--radius-sm)', border:'1px solid var(--border)', background:'var(--bg-secondary)', color: page===1 ? 'var(--text-muted)' : 'var(--text-primary)', cursor: page===1 ? 'not-allowed' : 'pointer', fontSize:'0.82rem' }}>
              ← Prev
            </button>
            <span style={{ fontSize:'0.82rem', color:'var(--text-muted)', alignSelf:'center' }}>Page {page}</span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={users.length < 20}
              style={{ padding:'6px 16px', borderRadius:'var(--radius-sm)', border:'1px solid var(--border)', background:'var(--bg-secondary)', color: users.length<20 ? 'var(--text-muted)' : 'var(--text-primary)', cursor: users.length<20 ? 'not-allowed' : 'pointer', fontSize:'0.82rem' }}>
              Next →
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}