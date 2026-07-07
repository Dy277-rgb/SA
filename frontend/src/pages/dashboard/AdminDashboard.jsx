import { useEffect, useMemo, useState } from 'react'
import { Users, Plane, DollarSign, TrendingUp, Trash2 } from 'lucide-react'
import { airlines, generateFlights } from '../../data/mockData.js'
import Loader from '../../components/common/Loader.jsx'
import api from '../../api/axios.js'

export default function AdminDashboard() {
  const [tab, setTab] = useState('overview')
  const [bookings, setBookings] = useState([])
  const [flights, setFlights] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const [b, f] = await Promise.all([api.get('/admin/bookings'), api.get('/admin/flights')])
        if (active) {
          setBookings(b.data.bookings)
          setFlights(f.data.flights)
        }
      } catch {
        if (active) {
          setBookings(JSON.parse(localStorage.getItem('skylane_bookings') || '[]'))
          setFlights(generateFlights({ from: 'JFK', to: 'LHR' }))
        }
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => { active = false }
  }, [])

  const stats = useMemo(() => {
    const revenue = bookings.reduce((sum, b) => sum + Number(b.total || 0), 0)
    const uniqueUsers = new Set(bookings.map((b) => b.userId)).size
    return {
      revenue,
      bookingsCount: bookings.length,
      users: uniqueUsers || 128,
      flights: flights.length,
    }
  }, [bookings, flights])

  function removeFlight(id) {
    setFlights((prev) => prev.filter((f) => f.id !== id))
  }

  if (loading) return <Loader label="Loading admin data..." />

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="mb-1 font-display text-2xl font-bold text-ink">Admin dashboard</h1>
      <p className="mb-8 text-sm text-slate">Manage flights, bookings, and monitor performance.</p>

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={DollarSign} label="Total revenue" value={`$${stats.revenue.toLocaleString()}`} />
        <StatCard icon={TrendingUp} label="Bookings" value={stats.bookingsCount} />
        <StatCard icon={Users} label="Registered users" value={stats.users} />
        <StatCard icon={Plane} label="Active flights" value={stats.flights} />
      </div>

      <div className="mb-6 flex gap-2 border-b border-slate-light/30">
        {['overview', 'bookings', 'flights', 'airlines'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`border-b-2 px-4 py-2 text-sm font-semibold capitalize transition ${
              tab === t ? 'border-sky text-sky' : 'border-transparent text-slate hover:text-ink'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="rounded-2xl border border-slate-light/30 bg-white p-6">
          <h3 className="mb-4 font-display text-sm font-semibold text-ink">Recent bookings</h3>
          {bookings.length === 0 ? (
            <p className="text-sm text-slate">No bookings recorded yet.</p>
          ) : (
            <ul className="divide-y divide-slate-light/20">
              {bookings.slice(0, 6).map((b) => (
                <li key={b.reference} className="flex items-center justify-between py-3 text-sm">
                  <span className="font-mono text-slate">{b.reference}</span>
                  <span className="text-ink">{b.flight?.from} → {b.flight?.to}</span>
                  <span className="font-semibold text-ink">${b.total}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {tab === 'bookings' && (
        <div className="overflow-x-auto rounded-2xl border border-slate-light/30 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-mist text-xs uppercase tracking-wide text-slate">
              <tr>
                <th className="px-5 py-3">Reference</th>
                <th className="px-5 py-3">Route</th>
                <th className="px-5 py-3">Passengers</th>
                <th className="px-5 py-3">Total</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-light/20">
              {bookings.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-6 text-center text-slate">No bookings yet.</td></tr>
              ) : bookings.map((b) => (
                <tr key={b.reference}>
                  <td className="px-5 py-3 font-mono">{b.reference}</td>
                  <td className="px-5 py-3">{b.flight?.from} → {b.flight?.to}</td>
                  <td className="px-5 py-3">{b.passengers?.length || 1}</td>
                  <td className="px-5 py-3 font-semibold">${b.total}</td>
                  <td className="px-5 py-3">
                    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold capitalize text-green-700">
                      {b.status || 'confirmed'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'flights' && (
        <div className="overflow-x-auto rounded-2xl border border-slate-light/30 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-mist text-xs uppercase tracking-wide text-slate">
              <tr>
                <th className="px-5 py-3">Flight</th>
                <th className="px-5 py-3">Route</th>
                <th className="px-5 py-3">Airline</th>
                <th className="px-5 py-3">Economy</th>
                <th className="px-5 py-3">Business</th>
                <th className="px-5 py-3">Seats left</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-light/20">
              {flights.map((f) => (
                <tr key={f.id}>
                  <td className="px-5 py-3 font-mono">{f.flightNo}</td>
                  <td className="px-5 py-3">{f.from} → {f.to}</td>
                  <td className="px-5 py-3">{f.airline.name}</td>
                  <td className="px-5 py-3">${f.priceEconomy}</td>
                  <td className="px-5 py-3">${f.priceBusiness}</td>
                  <td className="px-5 py-3">{f.seatsLeft}</td>
                  <td className="px-5 py-3">
                    <button onClick={() => removeFlight(f.id)} className="text-red-500 hover:text-red-700" aria-label="Remove flight">
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'airlines' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {airlines.map((a) => (
            <div key={a.id} className="rounded-2xl border border-slate-light/30 bg-white p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg font-display text-xs font-bold text-white" style={{ backgroundColor: a.color }}>
                {a.code}
              </div>
              <h4 className="mt-3 font-semibold text-ink">{a.name}</h4>
              <p className="text-xs text-slate">{a.fleet} · Rating {a.rating}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-slate-light/30 bg-white p-5">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-light text-sky">
        <Icon size={16} />
      </span>
      <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate">{label}</p>
      <p className="font-display text-2xl font-bold text-ink">{value}</p>
    </div>
  )
}
