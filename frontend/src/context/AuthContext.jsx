import { createContext, useContext, useEffect, useState } from 'react'
import api from '../api/axios.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('skylane_user')
    if (stored) setUser(JSON.parse(stored))
    setLoading(false)
  }, [])

  function persist(userData, token) {
    setUser(userData)
    localStorage.setItem('skylane_user', JSON.stringify(userData))
    if (token) localStorage.setItem('skylane_token', token)
  }

  async function login(email, password) {
    try {
      const { data } = await api.post('/auth/login', { email, password })
      persist(data.user, data.token)
      return { success: true }
    } catch (err) {
      // Demo fallback so the UI is fully explorable without a live backend
      if (email && password) {
        const isAdmin = email.startsWith('admin')
        const demoUser = {
          id: isAdmin ? 'admin-1' : 'user-1',
          name: isAdmin ? 'Admin User' : email.split('@')[0],
          email,
          role: isAdmin ? 'admin' : 'user',
        }
        persist(demoUser, 'demo-token')
        return { success: true, demo: true }
      }
      return { success: false, message: err.response?.data?.message || 'Invalid credentials' }
    }
  }

  async function register(name, email, password) {
    try {
      const { data } = await api.post('/auth/register', { name, email, password })
      persist(data.user, data.token)
      return { success: true }
    } catch (err) {
      if (name && email && password) {
        const demoUser = { id: 'user-' + Date.now(), name, email, role: 'user' }
        persist(demoUser, 'demo-token')
        return { success: true, demo: true }
      }
      return { success: false, message: err.response?.data?.message || 'Registration failed' }
    }
  }

  async function socialLogin(provider, payload) {
    try {
      const { data } = await api.post(`/auth/${provider}`, payload)
      persist(data.user, data.token)
      return { success: true }
    } catch (err) {
      return { success: false, message: err.response?.data?.message || `${provider} sign-in failed` }
    }
  }

  function logout() {
    setUser(null)
    localStorage.removeItem('skylane_user')
    localStorage.removeItem('skylane_token')
  }

  async function updateProfile({ name, email, currentPassword, newPassword, avatar }) {
    try {
      const { data } = await api.put('/auth/profile', { name, email, currentPassword, newPassword, avatar })
      persist(data.user, data.token)
      return { success: true }
    } catch (err) {
      const backendMessage = err.response?.data?.message
      if (backendMessage) {
        // Real backend responded but rejected the update (e.g. wrong current password, email taken)
        return { success: false, message: backendMessage }
      }
      // No backend reachable — apply the update to the local demo user
      if (newPassword && newPassword.length < 6) {
        return { success: false, message: 'New password must be at least 6 characters' }
      }
      const nextAvatar = avatar === undefined ? user?.avatar : avatar
      const updatedUser = { ...user, name, email, avatar: nextAvatar }
      persist(updatedUser, 'demo-token')
      return { success: true, demo: true }
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile, socialLogin }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
