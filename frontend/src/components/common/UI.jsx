// src/components/common/UI.jsx
// Reusable design system components

import { forwardRef, useState } from 'react'
import { Eye, EyeOff, Loader2, X, AlertCircle, CheckCircle, Info } from 'lucide-react'

/* ─── Button ──────────────────────────────────────────────────────────────── */
export const Button = forwardRef(({
  children, variant = 'primary', size = 'md', loading = false,
  disabled = false, fullWidth = false, icon, className = '', ...props
}, ref) => {
  const base = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    gap: '8px', fontFamily: 'var(--font-body)', fontWeight: 600,
    borderRadius: 'var(--radius-md)', border: '1px solid transparent',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    transition: 'all var(--transition)',
    width: fullWidth ? '100%' : 'auto',
    textDecoration: 'none',
    letterSpacing: '-0.01em',
  }

  const sizes = {
    sm: { padding: '6px 14px', fontSize: '0.8rem' },
    md: { padding: '10px 20px', fontSize: '0.875rem' },
    lg: { padding: '13px 28px', fontSize: '1rem' },
  }

  const variants = {
    primary: {
      background: 'linear-gradient(135deg, var(--teal-600), var(--teal-500))',
      color: 'white',
      borderColor: 'transparent',
      boxShadow: '0 4px 12px rgba(21,101,192,0.3)',
    },
    secondary: {
      background: 'var(--bg-card)',
      color: 'var(--text-primary)',
      borderColor: 'var(--border)',
    },
    danger: {
      background: 'linear-gradient(135deg, var(--rose-600), var(--rose-500))',
      color: 'white',
      borderColor: 'transparent',
    },
    ghost: {
      background: 'transparent',
      color: 'var(--text-secondary)',
      borderColor: 'transparent',
    },
    outline: {
      background: 'transparent',
      color: 'var(--teal-400)',
      borderColor: 'var(--border-accent)',
    },
    success: {
      background: 'linear-gradient(135deg, var(--green-600), var(--green-500))',
      color: 'white',
      borderColor: 'transparent',
    },
  }

  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      style={{ ...base, ...sizes[size], ...variants[variant] }}
      className={className}
      {...props}
    >
      {loading ? <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> : icon}
      {children}
    </button>
  )
})
Button.displayName = 'Button'

/* ─── Input ───────────────────────────────────────────────────────────────── */
export const Input = forwardRef(({
  label, error, hint, type = 'text', icon: Icon,
  className = '', containerClassName = '', required = false, ...props
}, ref) => {
  const [showPw, setShowPw] = useState(false)
  const isPassword = type === 'password'
  const inputType = isPassword ? (showPw ? 'text' : 'password') : type

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }} className={containerClassName}>
      {label && (
        <label style={{
          fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)',
          letterSpacing: '0.02em',
        }}>
          {label}{required && <span style={{ color: 'var(--rose-400)', marginLeft: 2 }}>*</span>}
        </label>
      )}
      <div style={{ position: 'relative' }}>
        {Icon && (
          <Icon size={15} style={{
            position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
            color: 'var(--text-muted)', pointerEvents: 'none',
          }} />
        )}
        <input
          ref={ref}
          type={inputType}
          style={{
            width: '100%',
            padding: Icon ? '10px 12px 10px 36px' : '10px 12px',
            paddingRight: isPassword ? '40px' : '12px',
            background: 'var(--bg-card)',
            border: `1px solid ${error ? 'var(--rose-500)' : 'var(--border)'}`,
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-primary)',
            fontSize: '0.875rem',
            fontFamily: 'var(--font-body)',
            transition: 'border-color var(--transition), box-shadow var(--transition)',
            outline: 'none',
          }}
          onFocus={e => {
            e.target.style.borderColor = error ? 'var(--rose-500)' : 'var(--teal-400)'
            e.target.style.boxShadow = error
              ? '0 0 0 3px rgba(229,57,53,0.12)'
              : '0 0 0 3px rgba(66,165,245,0.12)'
          }}
          onBlur={e => {
            e.target.style.borderColor = error ? 'var(--rose-500)' : 'var(--border)'
            e.target.style.boxShadow = 'none'
          }}
          className={className}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPw(p => !p)}
            style={{
              position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
              color: 'var(--text-muted)', padding: 4,
            }}
          >
            {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        )}
      </div>
      {error && <p style={{ fontSize: '0.78rem', color: 'var(--rose-400)', display: 'flex', alignItems: 'center', gap: 4 }}><AlertCircle size={12} />{error}</p>}
      {hint && !error && <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{hint}</p>}
    </div>
  )
})
Input.displayName = 'Input'

/* ─── Select ──────────────────────────────────────────────────────────────── */
export const Select = forwardRef(({ label, error, options = [], className = '', required = false, ...props }, ref) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }} className={className}>
    {label && (
      <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
        {label}{required && <span style={{ color: 'var(--rose-400)', marginLeft: 2 }}>*</span>}
      </label>
    )}
    <select
      ref={ref}
      style={{
        width: '100%', padding: '10px 12px',
        background: 'var(--bg-card)',
        border: `1px solid ${error ? 'var(--rose-500)' : 'var(--border)'}`,
        borderRadius: 'var(--radius-md)',
        color: 'var(--text-primary)', fontSize: '0.875rem',
        fontFamily: 'var(--font-body)', outline: 'none', cursor: 'pointer',
      }}
      {...props}
    >
      {options.map(o => (
        <option key={o.value} value={o.value} style={{ background: 'var(--teal-900)' }}>{o.label}</option>
      ))}
    </select>
    {error && <p style={{ fontSize: '0.78rem', color: 'var(--rose-400)' }}>{error}</p>}
  </div>
))
Select.displayName = 'Select'

/* ─── Card ────────────────────────────────────────────────────────────────── */
export const Card = ({ children, className = '', style = {}, hover = false, onClick, padding = '20px' }) => (
  <div
    className={`card ${className}`}
    style={{ padding, cursor: onClick ? 'pointer' : 'default', ...style }}
    onClick={onClick}
  >
    {children}
  </div>
)

/* ─── Stat Card ───────────────────────────────────────────────────────────── */
export const StatCard = ({ title, value, unit, icon: Icon, color = 'var(--teal-400)', trend, trendLabel, subtitle }) => (
  <Card style={{ position: 'relative', overflow: 'hidden' }}>
    <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: color, opacity: 0.06 }} />
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
      <div style={{
        width: 40, height: 40, borderRadius: 10,
        background: `${color}18`,
        border: `1px solid ${color}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color,
      }}>
        <Icon size={18} />
      </div>
      {trend !== undefined && (
        <span style={{
          fontSize: '0.72rem', fontWeight: 700,
          color: trend >= 0 ? 'var(--green-400)' : 'var(--rose-400)',
          background: trend >= 0 ? 'rgba(67,160,71,0.1)' : 'rgba(229,57,53,0.1)',
          padding: '2px 8px', borderRadius: 100,
        }}>
          {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
        </span>
      )}
    </div>
    <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-display)', color, lineHeight: 1 }}>
      {value ?? '—'}
      {unit && <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-secondary)', marginLeft: 4 }}>{unit}</span>}
    </div>
    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 6, fontWeight: 500 }}>{title}</div>
    {(trendLabel || subtitle) && (
      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>{trendLabel || subtitle}</div>
    )}
  </Card>
)

/* ─── Modal ───────────────────────────────────────────────────────────────── */
export const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null
  const widths = { sm: 400, md: 540, lg: 720, xl: 900 }

  return (
    <div style={{
      position: 'fixed', inset: 0, z: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px',
      zIndex: 1000,
    }}>
      <div
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />
      <div style={{
        position: 'relative', zIndex: 1,
        width: '100%', maxWidth: widths[size],
        background: 'var(--teal-900)',
        border: '1px solid var(--border-accent)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-lg)',
        animation: 'fadeIn 0.25s ease',
        maxHeight: '90vh', overflow: 'auto',
      }}>
        {title && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '20px 24px', borderBottom: '1px solid var(--border)',
          }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 700 }}>{title}</h3>
            <button onClick={onClose} style={{ color: 'var(--text-muted)', padding: 4, borderRadius: 8, transition: 'all var(--transition)' }}>
              <X size={18} />
            </button>
          </div>
        )}
        <div style={{ padding: '24px' }}>
          {children}
        </div>
      </div>
    </div>
  )
}

/* ─── Empty State ─────────────────────────────────────────────────────────── */
export const EmptyState = ({ icon: Icon, title, description, action }) => (
  <div style={{
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    padding: '60px 20px', textAlign: 'center', gap: 16,
  }}>
    <div style={{
      width: 64, height: 64, borderRadius: 16,
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'var(--text-muted)',
    }}>
      <Icon size={28} />
    </div>
    <div>
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 600, marginBottom: 8 }}>{title}</h3>
      {description && <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', maxWidth: 300 }}>{description}</p>}
    </div>
    {action}
  </div>
)

/* ─── Loading Spinner ─────────────────────────────────────────────────────── */
export const Spinner = ({ size = 24, color = 'var(--teal-400)' }) => (
  <div style={{
    width: size, height: size, borderRadius: '50%',
    border: `2px solid var(--border)`,
    borderTopColor: color,
    animation: 'spin 0.8s linear infinite',
    flexShrink: 0,
  }} />
)

export const LoadingCard = () => (
  <Card>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="skeleton" style={{ height: 16, width: '60%', borderRadius: 8 }} />
      <div className="skeleton" style={{ height: 32, width: '40%', borderRadius: 8 }} />
      <div className="skeleton" style={{ height: 12, width: '80%', borderRadius: 8 }} />
    </div>
  </Card>
)

/* ─── Section Header ──────────────────────────────────────────────────────── */
export const SectionHeader = ({ title, subtitle, action }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
    <div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 700, marginBottom: 4 }}>{title}</h2>
      {subtitle && <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{subtitle}</p>}
    </div>
    {action}
  </div>
)

/* ─── Alert ───────────────────────────────────────────────────────────────── */
export const Alert = ({ type = 'info', title, children }) => {
  const configs = {
    info:    { icon: Info,          color: 'var(--teal-400)',  bg: 'rgba(66,165,245,0.08)',  border: 'rgba(66,165,245,0.2)' },
    success: { icon: CheckCircle,   color: 'var(--green-400)', bg: 'rgba(67,160,71,0.08)',   border: 'rgba(67,160,71,0.2)' },
    warning: { icon: AlertCircle,   color: 'var(--amber-400)', bg: 'rgba(255,160,0,0.08)',   border: 'rgba(255,160,0,0.2)' },
    error:   { icon: AlertCircle,   color: 'var(--rose-400)',  bg: 'rgba(229,57,53,0.08)',   border: 'rgba(229,57,53,0.2)' },
  }
  const { icon: Icon, color, bg, border } = configs[type]
  return (
    <div style={{
      display: 'flex', gap: 12, padding: '12px 16px',
      background: bg, border: `1px solid ${border}`,
      borderRadius: 'var(--radius-md)',
    }}>
      <Icon size={16} style={{ color, flexShrink: 0, marginTop: 2 }} />
      <div>
        {title && <div style={{ fontWeight: 600, fontSize: '0.875rem', color, marginBottom: 4 }}>{title}</div>}
        <div style={{ fontSize: '0.845rem', color: 'var(--text-secondary)' }}>{children}</div>
      </div>
    </div>
  )
}

/* ─── Tabs ────────────────────────────────────────────────────────────────── */
export const Tabs = ({ tabs, active, onChange }) => (
  <div style={{
    display: 'flex', gap: 4, padding: 4,
    background: 'var(--bg-card)', borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border)', width: 'fit-content',
  }}>
    {tabs.map(tab => (
      <button
        key={tab.value}
        onClick={() => onChange(tab.value)}
        style={{
          padding: '7px 16px', borderRadius: 8,
          fontSize: '0.82rem', fontWeight: 600,
          color: active === tab.value ? 'var(--text-primary)' : 'var(--text-muted)',
          background: active === tab.value ? 'var(--teal-700)' : 'transparent',
          transition: 'all var(--transition)',
          border: 'none', cursor: 'pointer',
        }}
      >
        {tab.label}
      </button>
    ))}
  </div>
)

/* ─── Progress Bar ────────────────────────────────────────────────────────── */
export const ProgressBar = ({ value, max = 100, color = 'var(--teal-400)', label, showValue = true }) => {
  const pct = Math.min(100, (value / max) * 100)
  return (
    <div>
      {(label || showValue) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          {label && <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{label}</span>}
          {showValue && <span style={{ fontSize: '0.8rem', fontWeight: 600, color }}>{Math.round(pct)}%</span>}
        </div>
      )}
      <div style={{ height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct}%`,
          background: `linear-gradient(90deg, ${color}, ${color}88)`,
          borderRadius: 3,
          transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
        }} />
      </div>
    </div>
  )
}
