// src/context/SocketContext.jsx
import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import { useAuth } from './AuthContext'
import toast from 'react-hot-toast'

const SocketContext = createContext(null)

// Map alert priority → toast style
const priorityToast = (title, body, priority) => {
  const styles = {
    urgent: { style: { background: '#7c3aed', color: '#fff', fontWeight: 600 }, duration: 8000, icon: '🚨' },
    high:   { style: { background: '#d97706', color: '#fff', fontWeight: 600 }, duration: 6000, icon: '🔔' },
    normal: { style: { background: '#0d9488', color: '#fff' },                  duration: 5000, icon: '⏰' },
    low:    { style: { background: '#334155', color: '#e2e8f0' },               duration: 4000, icon: 'ℹ️' },
  }
  const cfg = styles[priority] || styles.normal
  toast(`${cfg.icon} ${title}\n${body}`, { style: cfg.style, duration: cfg.duration })
}

export const SocketProvider = ({ children }) => {
  const { user } = useAuth()
  const socketRef = useRef(null)
  const [connected, setConnected] = useState(false)
  const [notifications, setNotifications] = useState([])

  const addNotif = useCallback((n) => setNotifications(prev => [n, ...prev].slice(0, 50)), [])

  useEffect(() => {
    if (!user) {
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
        setConnected(false)
      }
      return
    }

    import('socket.io-client').then(({ io }) => {
      const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
        auth: { token: localStorage.getItem('hc_token') },
        transports: ['websocket', 'polling'],
      })

      socketRef.current = socket

      socket.on('connect', () => {
        setConnected(true)
        socket.emit('join', { userId: user._id, role: user.role })
      })

      socket.on('disconnect', () => setConnected(false))

      // ── Chat message ──
      socket.on('receive_message', (data) => {
        addNotif({ type: 'message', timestamp: new Date(), ...data })
      })

      // ── Emergency ──
      socket.on('emergency_alert', (data) => {
        addNotif({ type: 'emergency', timestamp: new Date(), ...data })
        toast.error('🚨 Emergency alert received!', { duration: 10000 })
      })

      // ── Health data ──
      socket.on('health_data_updated', (data) => {
        addNotif({ type: 'health', timestamp: new Date(), ...data })
      })

      // ── Appointment confirmed (by doctor) ──
      socket.on('appointmentConfirmed', (data) => {
        addNotif({ type: 'appointment', title: 'Appointment Confirmed', body: 'Your appointment has been confirmed by the doctor.', timestamp: new Date(), ...data })
        toast.success('✅ Your appointment has been confirmed!', { duration: 5000 })
      })

      // ── Timed countdown / overdue alerts from cron ──
      socket.on('appointmentAlert', (data) => {
        const { title, body, priority, _id } = data
        addNotif({ type: 'appointmentAlert', title, body, priority, timestamp: new Date(), _id })
        priorityToast(title, body, priority)
      })

      // ── New appointment (doctor side) ──
      socket.on('newAppointment', (data) => {
        addNotif({ type: 'newAppointment', title: 'New Appointment Booked', body: `A patient has booked an appointment.`, timestamp: new Date(), ...data })
        toast('📅 New appointment booked by a patient.', { duration: 5000 })
      })

    }).catch(() => {
      console.warn('Socket.IO not available in this environment')
    })

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
      }
    }
  }, [user, addNotif])

  const emit = (event, data) => {
    if (socketRef.current?.connected) socketRef.current.emit(event, data)
  }

  const clearNotification = (index) => {
    setNotifications(prev => prev.filter((_, i) => i !== index))
  }

  const clearAll = () => setNotifications([])

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, connected, notifications, emit, clearNotification, clearAll }}>
      {children}
    </SocketContext.Provider>
  )
}

export const useSocket = () => useContext(SocketContext)
