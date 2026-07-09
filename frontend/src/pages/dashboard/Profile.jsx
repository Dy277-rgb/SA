import { useState } from 'react'
import { User as UserIcon, Mail, Lock } from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'
import Button from '../../components/common/Button.jsx'

export default function Profile() {
  const { user, updateProfile } = useAuth()
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null) // { type: 'success' | 'error', text }

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setMessage(null)

    if (form.newPassword && form.newPassword !== form.confirmNewPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' })
      return
    }

    setSaving(true)
    const res = await updateProfile({
      name: form.name,
      email: form.email,
      currentPassword: form.currentPassword || undefined,
      newPassword: form.newPassword || undefined,
    })
    setSaving(false)

    if (res.success) {
      setMessage({ type: 'success', text: 'Profile updated successfully.' })
      setForm((f) => ({ ...f, currentPassword: '', newPassword: '', confirmNewPassword: '' }))
    } else {
      setMessage({ type: 'error', text: res.message })
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex items-center gap-4">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-sky text-white">
          <UserIcon size={24} />
        </span>
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Edit profile</h1>
          <p className="text-sm text-slate">Update your account details</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="ticket-stub shadow-card space-y-5 p-6">
        {message && (
          <p
            className={`rounded-lg px-3 py-2 text-sm ${
              message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
            }`}
          >
            {message.text}
          </p>
        )}

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate">Full name</label>
          <div className="flex items-center gap-2 rounded-lg border border-slate-light/40 px-3 py-2.5 focus-within:border-sky">
            <UserIcon size={16} className="text-slate-light" />
            <input
              required
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
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
              onChange={(e) => update('email', e.target.value)}
              className="w-full text-sm outline-none"
            />
          </div>
        </div>

        <div className="border-t border-dashed border-slate-light/40 pt-5">
          <h3 className="mb-3 text-sm font-semibold text-ink">Change password</h3>
          <p className="mb-3 text-xs text-slate">Leave blank if you don't want to change your password.</p>

          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate">Current password</label>
              <div className="flex items-center gap-2 rounded-lg border border-slate-light/40 px-3 py-2.5 focus-within:border-sky">
                <Lock size={16} className="text-slate-light" />
                <input
                  type="password"
                  value={form.currentPassword}
                  onChange={(e) => update('currentPassword', e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-sm outline-none"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate">New password</label>
              <div className="flex items-center gap-2 rounded-lg border border-slate-light/40 px-3 py-2.5 focus-within:border-sky">
                <Lock size={16} className="text-slate-light" />
                <input
                  type="password"
                  minLength={6}
                  value={form.newPassword}
                  onChange={(e) => update('newPassword', e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-sm outline-none"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate">Confirm new password</label>
              <div className="flex items-center gap-2 rounded-lg border border-slate-light/40 px-3 py-2.5 focus-within:border-sky">
                <Lock size={16} className="text-slate-light" />
                <input
                  type="password"
                  value={form.confirmNewPassword}
                  onChange={(e) => update('confirmNewPassword', e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-sm outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        <Button type="submit" disabled={saving} className="w-full">
          {saving ? 'Saving...' : 'Save changes'}
        </Button>
      </form>
    </div>
  )
}
