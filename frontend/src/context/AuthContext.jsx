// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authAPI } from '../services/api'
import { getTranslator } from '../utils/i18n'
import toast from 'react-hot-toast'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [darkMode, setDarkMode] = useState(true)
  const [language, setLanguage] = useState('en')

  // Bootstrap — check stored token
  useEffect(() => {
    const storedUser = localStorage.getItem('hc_user')
    const token      = localStorage.getItem('hc_token')
    const stored = localStorage.getItem('hc_dark')
    const dm = stored === null ? true : stored === 'true'  // default dark
    const lang       = localStorage.getItem('hc_lang') || 'en'
    setDarkMode(dm)
    setLanguage(lang)
    // dark=true → no attribute (CSS default is dark)
    // dark=false → set data-theme="light"
    if (dm) document.documentElement.removeAttribute('data-theme')
    else document.documentElement.setAttribute('data-theme', 'light')

    if (storedUser && token) {
      setUser(JSON.parse(storedUser))
      // validate token in background
      authAPI.me()
        .then(res => setUser(res.data.user || res.data.data))
        .catch(() => { clearAuth() })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const clearAuth = () => {
    localStorage.removeItem('hc_token')
    localStorage.removeItem('hc_refresh')
    localStorage.removeItem('hc_user')
    setUser(null)
  }

  const login = useCallback(async (email, password) => {
    const res = await authAPI.login({ email, password })
    const { token, refreshToken, user: u } = res.data
    localStorage.setItem('hc_token', token)
    if (refreshToken) localStorage.setItem('hc_refresh', refreshToken)
    localStorage.setItem('hc_user', JSON.stringify(u))
    setUser(u)
    return u
  }, [])

  const register = useCallback(async (data) => {
    const res = await authAPI.register(data)
    const { token, refreshToken, user: u } = res.data
    localStorage.setItem('hc_token', token)
    if (refreshToken) localStorage.setItem('hc_refresh', refreshToken)
    localStorage.setItem('hc_user', JSON.stringify(u))
    setUser(u)
    return u
  }, [])

  const logout = useCallback(async () => {
    try { await authAPI.logout() } catch {}
    clearAuth()
    toast.success('Logged out successfully')
  }, [])

  const updateUser = useCallback((updates) => {
    setUser(prev => {
      const updated = { ...prev, ...updates }
      localStorage.setItem('hc_user', JSON.stringify(updated))
      return updated
    })
  }, [])

  const toggleDarkMode = useCallback(() => {
    setDarkMode(prev => {
      const next = !prev
      localStorage.setItem('hc_dark', next)
      // CSS default (no attribute) = dark mode
      // [data-theme="light"] = light mode
      if (next) document.documentElement.removeAttribute('data-theme')
      else document.documentElement.setAttribute('data-theme', 'light')
      return next
    })
  }, [])

  const changeLanguage = useCallback((lang) => {
    setLanguage(lang)
    localStorage.setItem('hc_lang', lang)
    document.documentElement.setAttribute('lang', lang)
  }, [])

  // t('key') returns translated string for current language
  const t = getTranslator(language)

  return (
    <AuthContext.Provider value={{
      user, loading, darkMode, language, t,
      login, register, logout, updateUser,
      toggleDarkMode, changeLanguage,
      isPatient: user?.role === 'patient',
      isDoctor:  user?.role === 'doctor',
      isAdmin:   user?.role === 'admin',
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}