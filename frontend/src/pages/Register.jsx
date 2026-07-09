import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plane, Mail, Lock, User } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import Button from '../components/common/Button.jsx'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) {
      setError('Passwords do not match')
      return
    }
    setLoading(true)
    const res = await register(form.name, form.email, form.password)
    setLoading(false)
    if (res.success) {
      navigate('/dashboard')
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
        <h1 className="mt-4 font-display text-2xl font-bold text-ink">Create your account</h1>
        <p className="mt-1 text-sm text-slate">Book faster with saved passenger details</p>
      </div>

      <form onSubmit={handleSubmit} className="ticket-stub shadow-card space-y-4 p-6">
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate">Full name</label>
          <div className="flex items-center gap-2 rounded-lg border border-slate-light/40 px-3 py-2.5 focus-within:border-sky">
            <User size={16} className="text-slate-light" />
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Jane Doe"
              className="w-full text-sm outline-none"
            />
          </div>
        </div>

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
              minLength={6}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
              className="w-full text-sm outline-none"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate">Confirm password</label>
          <div className="flex items-center gap-2 rounded-lg border border-slate-light/40 px-3 py-2.5 focus-within:border-sky">
            <Lock size={16} className="text-slate-light" />
            <input
              type="password"
              required
              value={form.confirm}
              onChange={(e) => setForm({ ...form, confirm: e.target.value })}
              placeholder="••••••••"
              className="w-full text-sm outline-none"
            />
          </div>
        </div>

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Creating account...' : 'Create account'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-sky hover:underline">Log in</Link>
      </p>
    </div>
  )
}
