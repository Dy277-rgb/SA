import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Plane, Mail, Lock } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import Button from '../components/common/Button.jsx'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const res = await login(form.email, form.password)
    setLoading(false)
    if (res.success) {
      navigate(location.state?.from || '/dashboard')
    } else {
      setError(res.message)
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12 sm:px-6">
      <div className="mb-8 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-black">
              <img src="/LOgo.png" alt="SkyLane logo" className="h-9 w-9 rounded-full object-cover" />
        </span>
        <h1 className="mt-4 font-display text-2xl font-bold text-ink">Welcome back</h1>
        <p className="mt-1 text-sm text-slate">Log in to manage your bookings</p>
      </div>

      <form onSubmit={handleSubmit} className="ticket-stub shadow-card space-y-4 p-6">
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate">Email</label>
          <div className="flex items-center gap-2 rounded-lg border border-slate-light/40 px-3 py-2.5 focus-within:border-sky">
            <Mail size={16} className="text-slate-light" />
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@example.com"
              className="w-full text-sm outline-none"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate">Password</label>
          <div className="flex items-center gap-2 rounded-lg border border-slate-light/40 px-3 py-2.5 focus-within:border-sky">
            <Lock size={16} className="text-slate-light" />
            <input
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
              className="w-full text-sm outline-none"
            />
          </div>
        </div>

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Logging in...' : 'Log in'}
        </Button>

        <p className="text-center text-xs text-slate-light">
          Tip: use an email starting with "admin" (e.g. admin@skylane.com) to preview the admin dashboard.
        </p>
      </form>

      <p className="mt-6 text-center text-sm text-slate">
        Don't have an account?{' '}
        <Link to="/register" className="font-semibold text-sky hover:underline">Sign up</Link>
      </p>
    </div>
  )
}
