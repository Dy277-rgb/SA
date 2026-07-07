import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plane, Calendar, MapPin, User as UserIcon } from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'
import Loader from '../../components/common/Loader.jsx'
import api from '../../api/axios.js'

export default function UserDashboard() {
  const { user } = useAuth()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)

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

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center gap-4">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-sky text-white">
          <UserIcon size={24} />
        </span>
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Hi, {user?.name}</h1>
          <p className="text-sm text-slate">{user?.email}</p>
        </div>
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

      {loading ? (
        <Loader label="Loading your bookings..." />
      ) : bookings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-light/50 p-10 text-center text-slate">
          You don't have any bookings yet.
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => (
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
                </div>
              </div>
              <div className="flex items-center gap-4 sm:text-right">
                <div>
                  <p className="font-mono text-xs text-slate-light">{b.reference}</p>
                  <p className="font-semibold text-ink">${b.total}</p>
                </div>
                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold capitalize text-green-700">
                  {b.status || 'confirmed'}
                </span>
              </div>
            </div>
          ))}
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
