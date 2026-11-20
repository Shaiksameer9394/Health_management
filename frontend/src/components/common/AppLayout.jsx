// src/components/common/AppLayout.jsx
import { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useSocket } from '../../context/SocketContext'
import {
  Activity, LayoutDashboard, User, Pill, FileText, Calendar,
  Brain, MessageSquare, AlertTriangle, Users, ClipboardList,
  ShieldCheck, Settings, LogOut, Bell, Sun, Moon, Menu, X,
  Stethoscope, Heart, Globe, ChevronDown, Wifi, WifiOff
} from 'lucide-react'
import styles from './AppLayout.module.css'

const NAV_ITEMS = {
  patient: [
    { icon: LayoutDashboard, labelKey: 'dashboard',    path: '/patient/dashboard' },
    { icon: Activity,        labelKey: 'healthData',   path: '/patient/health-data' },
    { icon: Pill,            labelKey: 'medications',  path: '/patient/medications' },
    { icon: FileText,        labelKey: 'reports',      path: '/patient/reports' },
    { icon: Calendar,        labelKey: 'appointments', path: '/patient/appointments' },
    { icon: Brain,           labelKey: 'aiInsights',   path: '/patient/ai-insights' },
    { icon: MessageSquare,   labelKey: 'chat',         path: '/patient/chat' },
    { icon: AlertTriangle,   labelKey: 'emergency',    path: '/patient/emergency' },
    { icon: User,            labelKey: 'profile',      path: '/patient/profile' },
  ],
  doctor: [
  { icon: LayoutDashboard, labelKey: 'dashboard',    path: '/doctor/dashboard' },
  { icon: Users,           labelKey: 'myPatients',   path: '/doctor/patients' },
  { icon: Calendar,        labelKey: 'appointments', path: '/doctor/appointments' },
  { icon: ClipboardList,   labelKey: 'prescriptions',path: '/doctor/prescriptions' },
  { icon: MessageSquare,   labelKey: 'chat',         path: '/doctor/chat' },
],
  admin: [
    { icon: LayoutDashboard, labelKey: 'dashboard',    path: '/admin/dashboard' },
    { icon: Users,           labelKey: 'users',         path: '/admin/users' },
    { icon: ShieldCheck,     labelKey: 'drApprovals',   path: '/admin/approvals' },
  ],
}

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'te', label: 'తెలుగు' },
]

export default function AppLayout({ role }) {
  const { user, logout, darkMode, toggleDarkMode, language, changeLanguage, t } = useAuth()
  const { connected, notifications, clearAll } = useSocket() || {}
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileSidebar, setMobileSidebar] = useState(false)
  const [showLangMenu, setShowLangMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

  const navItems = (NAV_ITEMS[role] || []).map(item => ({ ...item, label: t(item.labelKey) || item.labelKey }))
  const unreadCount = (notifications || []).length

  useEffect(() => {
    setMobileSidebar(false)
  }, [location])

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) setSidebarOpen(false)
      else setSidebarOpen(true)
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const roleColors = {
    patient: 'var(--jade-500)',
    doctor:  'var(--teal-400)',
    admin:   'var(--amber-500)',
  }
  const roleAccent = roleColors[role] || 'var(--teal-400)'

  return (
    <div className={styles.main} style={{ marginLeft: sidebarOpen ? 240 : 64 }}>
      {/* Mobile overlay */}
      {mobileSidebar && (
        <div className={styles.overlay} onClick={() => setMobileSidebar(false)} />
      )}

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.expanded : styles.collapsed} ${mobileSidebar ? styles.mobileOpen : ''}`}>
        {/* Logo */}
        <div className={styles.logo}>
          <div className={styles.logoIcon} style={{ '--accent': roleAccent }}>
            <Heart size={20} fill="currentColor" />
          </div>
          {sidebarOpen && (
            <div className={styles.logoText}>
              <span className={styles.logoName}>HealthCore</span>
              <span className={styles.logoBadge} style={{ color: roleAccent }}>
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </span>
            </div>
          )}
          <button className={styles.collapseBtn} onClick={() => setSidebarOpen(p => !p)}>
            {sidebarOpen ? <ChevronDown size={14} style={{ transform: 'rotate(90deg)' }} /> : <ChevronDown size={14} style={{ transform: 'rotate(-90deg)' }} />}
          </button>
        </div>

        {/* Nav */}
        <nav className={styles.nav}>
          {navItems.map(({ icon: Icon, label, path }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
              style={({ isActive }) => isActive ? { '--item-accent': roleAccent } : {}}
            >
              <Icon size={18} className={styles.navIcon} />
              {sidebarOpen && <span className={styles.navLabel}>{label}</span>}
              {!sidebarOpen && <div className={styles.tooltip}>{label}</div>}
            </NavLink>
          ))}
        </nav>

        {/* Bottom section */}
        <div className={styles.sidebarBottom}>
          {/* Connection indicator */}
          <div className={styles.connStatus}>
            {connected
              ? <><Wifi size={12} color="var(--green-400)" /> {sidebarOpen && <span style={{ color: 'var(--green-400)', fontSize: '0.7rem' }}>Live</span>}</>
              : <><WifiOff size={12} color="var(--text-muted)" /> {sidebarOpen && <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Offline</span>}</>
            }
          </div>

          <button className={styles.navItem} onClick={handleLogout}>
            <LogOut size={18} className={styles.navIcon} style={{ color: 'var(--rose-400)' }} />
            {sidebarOpen && <span style={{ color: 'var(--rose-400)' }}>{t('logout')}</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className={styles.main}>
        {/* Top bar */}
        <header className={styles.topbar}>
          <div className={styles.topbarLeft}>
            <button className={styles.menuBtn} onClick={() => {
              if (window.innerWidth < 1024) setMobileSidebar(p => !p)
              else setSidebarOpen(p => !p)
            }}>
              <Menu size={20} />
            </button>

            {/* Page title derived from path */}
            <div className={styles.pageTitle}>
              {navItems.find(n => location.pathname.startsWith(n.path))?.label || 'Dashboard'}
            </div>
          </div>

          <div className={styles.topbarRight}>
            {/* Language */}
            <div className={styles.dropdown}>
              <button className={styles.iconBtn} onClick={() => setShowLangMenu(p => !p)}>
                <Globe size={18} />
                <span className={styles.langCode}>{language.toUpperCase()}</span>
              </button>
              {showLangMenu && (
                <div className={styles.dropMenu}>
                  {LANGUAGES.map(l => (
                    <button key={l.code} className={`${styles.dropItem} ${language === l.code ? styles.dropItemActive : ''}`}
                      onClick={() => { changeLanguage(l.code); setShowLangMenu(false) }}>
                      {l.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Dark mode */}
            <button className={styles.iconBtn} onClick={toggleDarkMode} title="Toggle theme">
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Notifications */}
            <div className={styles.dropdown}>
              <button className={styles.iconBtn} onClick={() => setShowNotifications(p => !p)}>
                <Bell size={18} />
                {unreadCount > 0 && <span className={styles.badge}>{unreadCount}</span>}
              </button>
              {showNotifications && (
                <div className={`${styles.dropMenu} ${styles.notifMenu}`}>
                  <div className={styles.dropHeader} style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span>Notifications {unreadCount > 0 && `(${unreadCount})`}</span>
                    {unreadCount > 0 && (
                      <button onClick={() => clearAll?.()}
                        style={{ background:'none', border:'none', color:'var(--text-muted)', fontSize:'0.75rem', cursor:'pointer', padding:'2px 6px' }}>
                        Clear all
                      </button>
                    )}
                  </div>
                  {(!notifications || notifications.length === 0) ? (
                    <div className={styles.emptyNotif}>No new notifications</div>
                  ) : (
                    (notifications || []).map((n, i) => {
                      // Determine dot colour and title per type
                      const dotColor = n.type === 'emergency' ? 'var(--rose-400)'
                        : n.priority === 'urgent' ? '#a855f7'
                        : n.priority === 'high'   ? '#f59e0b'
                        : n.type === 'message'    ? 'var(--teal-400)'
                        : n.type === 'appointmentAlert' ? '#f59e0b'
                        : 'var(--teal-400)'
                      const title = n.title
                        || (n.type === 'emergency'        ? '🚨 Emergency Alert'
                          : n.type === 'message'          ? '💬 New Message'
                          : n.type === 'appointmentAlert' ? '⏰ Appointment Alert'
                          : n.type === 'newAppointment'   ? '📅 New Appointment'
                          : '📅 Appointment Update')
                      return (
                        <div key={i} className={styles.notifItem}>
                          <span className={styles.notifDot} style={{ background: dotColor }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div className={styles.notifTitle}>{title}</div>
                            {n.body && <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', marginTop:2, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{n.body}</div>}
                            <div className={styles.notifTime}>{new Date(n.timestamp).toLocaleTimeString()}</div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              )}
            </div>

            {/* User menu */}
            <div className={styles.dropdown}>
              <button className={styles.userBtn} onClick={() => setShowUserMenu(p => !p)}>
                <div className={styles.avatar} style={{ '--accent': roleAccent }}>
                  {user?.avatar
                    ? <img src={`/uploads/avatars/${user.avatar}`} alt="avatar" />
                    : <span>{user?.firstName?.[0]}{user?.lastName?.[0]}</span>
                  }
                </div>
                <div className={styles.userInfo}>
                  <span className={styles.userName}>{user?.firstName} {user?.lastName}</span>
                  <span className={styles.userRole} style={{ color: roleAccent }}>{user?.role}</span>
                </div>
                <ChevronDown size={14} className={styles.chevron} />
              </button>
              {showUserMenu && (
                <div className={`${styles.dropMenu} ${styles.userMenu}`}>
                  <NavLink to={`/${role}/profile`} className={styles.dropItem} onClick={() => setShowUserMenu(false)}>
                    <User size={14} /> Profile Settings
                  </NavLink>
                  <div className={styles.dropDivider} />
                  <button className={`${styles.dropItem} ${styles.dropDanger}`} onClick={handleLogout}>
                    <LogOut size={14} /> Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}