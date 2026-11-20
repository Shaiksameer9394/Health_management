// src/components/common/InstallPrompt.jsx
// Shows a bottom banner on mobile/desktop prompting users to install the PWA
// Appears automatically when browser fires the beforeinstallprompt event

import { useState, useEffect } from 'react'
import { Download, X, Smartphone, Monitor } from 'lucide-react'

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showBanner, setShowBanner]         = useState(false)
  const [isIOS, setIsIOS]                   = useState(false)
  const [isInstalled, setIsInstalled]       = useState(false)

  useEffect(() => {
    // Check if already installed as PWA
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    // Detect iOS (Safari doesn't support beforeinstallprompt)
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream
    setIsIOS(ios)

    // iOS: show manual instructions after 3s if not dismissed before
    if (ios) {
      const dismissed = localStorage.getItem('hc_pwa_dismissed')
      if (!dismissed) {
        setTimeout(() => setShowBanner(true), 3000)
      }
      return
    }

    // Android/Desktop: listen for browser install prompt
    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      const dismissed = localStorage.getItem('hc_pwa_dismissed')
      if (!dismissed) setShowBanner(true)
    }

    window.addEventListener('beforeinstallprompt', handler)

    // Listen for successful install
    window.addEventListener('appinstalled', () => {
      setShowBanner(false)
      setIsInstalled(true)
    })

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setShowBanner(false)
      setIsInstalled(true)
    }
    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    setShowBanner(false)
    localStorage.setItem('hc_pwa_dismissed', 'true')
  }

  if (!showBanner || isInstalled) return null

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 9999,
      padding: '16px',
      background: 'linear-gradient(135deg, #0f2744, #0d1f3c)',
      borderTop: '1px solid rgba(13,148,136,0.3)',
      boxShadow: '0 -8px 32px rgba(0,0,0,0.4)',
      animation: 'slideUp 0.4s ease',
    }}>
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>

      <div style={{ maxWidth: 600, margin: '0 auto', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        {/* Icon */}
        <div style={{
          width: 48, height: 48, borderRadius: 12, flexShrink: 0,
          background: 'linear-gradient(135deg, #0d9488, #0891b2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: 22 }}>❤️</span>
        </div>

        {/* Content */}
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#e8edf5', marginBottom: 4 }}>
            Install HealthCore App
          </div>

          {isIOS ? (
            <div style={{ fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.6 }}>
              Tap <strong style={{ color: '#0d9488' }}>Share</strong> →{' '}
              <strong style={{ color: '#0d9488' }}>Add to Home Screen</strong> to install
              for offline access, faster loading & a native app experience.
            </div>
          ) : (
            <div style={{ fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.6 }}>
              Install for <strong style={{ color: '#e8edf5' }}>offline access</strong>,
              faster loading, and a native app experience on your device.
            </div>
          )}

          {/* Feature pills */}
          <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
            {['📴 Works offline', '🔔 Push notifications', '⚡ Faster', '📱 App-like'].map(f => (
              <span key={f} style={{
                fontSize: '0.72rem', padding: '3px 10px', borderRadius: 20,
                background: 'rgba(13,148,136,0.15)', color: '#5eead4',
                border: '1px solid rgba(13,148,136,0.25)',
              }}>{f}</span>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
          {!isIOS && deferredPrompt && (
            <button onClick={handleInstall} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', borderRadius: 8,
              background: 'linear-gradient(135deg, #0d9488, #0891b2)',
              color: 'white', fontWeight: 700, fontSize: '0.82rem',
              border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
            }}>
              <Download size={14} /> Install App
            </button>
          )}
          <button onClick={handleDismiss} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 12px', borderRadius: 8,
            background: 'rgba(255,255,255,0.05)', color: '#94a3b8',
            fontSize: '0.78rem', border: '1px solid rgba(255,255,255,0.08)',
            cursor: 'pointer', whiteSpace: 'nowrap',
          }}>
            <X size={12} /> {isIOS ? 'Got it' : 'Not now'}
          </button>
        </div>
      </div>
    </div>
  )
}