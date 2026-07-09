import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plane, Calendar, MapPin, User as UserIcon, Clock, X, Settings } from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'
import Loader from '../../components/common/Loader.jsx'
import api from '../../api/axios.js'

const FREE_CANCELLATION_HOURS = 24

function hoursSince(dateStr) {
  if (!dateStr) return Infinity
  return (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60)
}

function canCancel(booking) {
  return booking.status === 'confirmed' && hoursSince(booking.createdAt) < FREE_CANCELLATION_HOURS
}

export default function UserDashboard() {
  const { user } = useAuth()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [cancellingRef, setCancellingRef] = useState(null)
  const [message, setMessage] = useState(null) // { type: 'error' | 'success', text }

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const { data } = await api.get('/bookings/mine')
        if (active) setBookings(data.bookings)
      } catch {
        const all = JSON.parse(localStorage.getItem('skylane_bookings') || '[]')
        if (active) setBookings(all.filter((b) => b.userId === user?.id))
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => { active = false }
  }, [user])

  const upcoming = bookings.filter((b) => new Date(b.flight.departTime) >= new Date())
  const past = bookings.filter((b) => new Date(b.flight.departTime) < new Date())

  async function handleCancel(booking) {
    if (!canCancel(booking)) return
    const confirmed = window.confirm(
      `Cancel booking ${booking.reference}? This is free within 24 hours of booking and cannot be undone.`
    )
    if (!confirmed) return

    setCancellingRef(booking.reference)
    setMessage(null)

    try {
      await api.delete(`/bookings/${booking.reference}`)
      setBookings((prev) =>
        prev.map((b) => (b.reference === booking.reference ? { ...b, status: 'cancelled' } : b))
      )
      setMessage({ type: 'success', text: `Booking ${booking.reference} cancelled. Refund initiated.` })
    } catch (err) {
      const backendMessage = err.response?.data?.message
      if (backendMessage) {
        // Real backend responded but declined the cancellation (e.g. window expired)
        setMessage({ type: 'error', text: backendMessage })
      } else {
        // No backend reachable — apply the same 24h rule to the local demo fallback
        const all = JSON.parse(localStorage.getItem('skylane_bookings') || '[]')
        const updated = all.map((b) =>
          b.reference === booking.reference ? { ...b, status: 'cancelled' } : b
        )
        localStorage.setItem('skylane_bookings', JSON.stringify(updated))
        setBookings((prev) =>
          prev.map((b) => (b.reference === booking.reference ? { ...b, status: 'cancelled' } : b))
        )
        setMessage({ type: 'success', text: `Booking ${booking.reference} cancelled. Refund initiated.` })
      }
    } finally {
      setCancellingRef(null)
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {user?.avatar ? (
            <img src={user.avatar} alt="" className="h-14 w-14 rounded-full object-cover" />
          ) : (
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-sky text-white">
              <UserIcon size={24} />
            </span>
          )}
          <div>
            <h1 className="font-display text-2xl font-bold text-ink">Hi, {user?.name}</h1>
            <p className="text-sm text-slate">{user?.email}</p>
          </div>
        </div>
        <Link
          to="/profile"
          className="flex items-center gap-2 rounded-lg border border-slate-light/40 px-4 py-2 text-sm font-semibold text-ink hover:bg-mist"
        >
          <Settings size={15} /> Edit profile
        </Link>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total trips" value={bookings.length} />
        <StatCard label="Upcoming" value={upcoming.length} />
        <StatCard label="Completed" value={past.length} />
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold text-ink">My bookings</h2>
        <Link to="/search" className="rounded-lg bg-sky px-4 py-2 text-sm font-semibold text-white hover:bg-sky-dark">
          Book a new flight
        </Link>
      </div>

      {message && (
        <div
          className={`mb-4 rounded-lg px-4 py-2.5 text-sm ${
            message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
          }`}
        >
          {message.text}
        </div>
      )}

      {loading ? (
        <Loader label="Loading your bookings..." />
      ) : bookings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-light/50 p-10 text-center text-slate">
          You don't have any bookings yet.
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => {
            const eligible = canCancel(b)
            const hoursLeft = Math.max(0, FREE_CANCELLATION_HOURS - hoursSince(b.createdAt))
            return (
              <div key={b.reference} className="ticket-stub shadow-card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-light text-sky">
                    <Plane size={18} className="-rotate-45" />
                  </span>
                  <div>
                    <p className="font-semibold text-ink">{b.flight.from} → {b.flight.to}</p>
                    <p className="flex items-center gap-1 text-xs text-slate">
                      <Calendar size={12} /> {new Date(b.flight.departTime).toLocaleDateString()}
                      <MapPin size={12} className="ml-2" /> {b.seats?.map((s) => s.id).join(', ')}
                    </p>
                    {eligible && (
                      <p className="mt-1 flex items-center gap-1 text-xs text-sunrise-dark">
                        <Clock size={11} /> Free cancellation for {Math.ceil(hoursLeft)}h more
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4 sm:text-right">
                  <div>
                    <p className="font-mono text-xs text-slate-light">{b.reference}</p>
                    <p className="font-semibold text-ink">${b.total}</p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                      b.status === 'cancelled'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-green-100 text-green-700'
                    }`}
                  >
                    {b.status || 'confirmed'}
                  </span>
                  {eligible && (
                    <button
                      onClick={() => handleCancel(b)}
                      disabled={cancellingRef === b.reference}
                      className="flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                    >
                      <X size={13} />
                      {cancellingRef === b.reference ? 'Cancelling...' : 'Cancel'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-light/30 bg-white p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate">{label}</p>
      <p className="mt-1 font-display text-3xl font-bold text-ink">{value}</p>
    </div>
  )
}
