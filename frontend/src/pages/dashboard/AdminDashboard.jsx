import { useEffect, useMemo, useState } from 'react'
import { Users, Plane, DollarSign, TrendingUp, Trash2, Plus, X, ShieldCheck, ShieldOff, XCircle } from 'lucide-react'
import { airlines as mockAirlines, airports, mockUsers, generateFlights } from '../../data/mockData.js'
import { useAuth } from '../../context/AuthContext.jsx'
import Loader from '../../components/common/Loader.jsx'
import Button from '../../components/common/Button.jsx'
import api from '../../api/axios.js'

function extractNumericId(id) {
  const match = String(id).match(/(\d+)$/)
  return match ? match[1] : id
}

const emptyFlightForm = {
  flightNo: '', airlineId: '', from: 'JFK', to: 'LHR',
  departTime: '', arriveTime: '', duration: '', stops: 0,
  priceEconomy: '', priceBusiness: '', seatsLeft: 50,
}

export default function AdminDashboard() {
  const { user } = useAuth()
  const [tab, setTab] = useState('overview')
  const [bookings, setBookings] = useState([])
  const [flights, setFlights] = useState([])
  const [users, setUsers] = useState([])
  const [airlineOptions, setAirlineOptions] = useState([])
  const [loading, setLoading] = useState(true)

  const [showAddFlight, setShowAddFlight] = useState(false)
  const [flightForm, setFlightForm] = useState(emptyFlightForm)
  const [flightSaving, setFlightSaving] = useState(false)
  const [flightError, setFlightError] = useState('')

  const [cancellingRef, setCancellingRef] = useState(null)
  const [bookingMessage, setBookingMessage] = useState(null)

  const [userActionId, setUserActionId] = useState(null)
  const [userMessage, setUserMessage] = useState(null)

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const [b, f, u, a] = await Promise.all([
          api.get('/admin/bookings'),
          api.get('/admin/flights'),
          api.get('/admin/users'),
          api.get('/flights/airlines'),
        ])
        if (active) {
          setBookings(b.data.bookings)
          setFlights(f.data.flights)
          setUsers(u.data.users)
          setAirlineOptions(a.data.airlines)
        }
      } catch {
        if (active) {
          setBookings(JSON.parse(localStorage.getItem('skylane_bookings') || '[]'))
          setFlights(generateFlights({ from: 'JFK', to: 'LHR' }))
          setUsers(mockUsers)
          setAirlineOptions(mockAirlines)
        }
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => { active = false }
  }, [])

  const stats = useMemo(() => {
    const revenue = bookings
      .filter((b) => b.status !== 'cancelled')
      .reduce((sum, b) => sum + Number(b.total || 0), 0)
    const uniqueUsers = new Set(bookings.map((b) => b.userId)).size
    return {
      revenue,
      bookingsCount: bookings.length,
      users: users.length || uniqueUsers || 128,
      flights: flights.length,
    }
  }, [bookings, flights, users])

  // ---------- Flights ----------
  async function handleAddFlight(e) {
    e.preventDefault()
    setFlightError('')

    const required = ['flightNo', 'airlineId', 'from', 'to', 'departTime', 'arriveTime', 'duration', 'priceEconomy', 'priceBusiness']
    if (required.some((k) => !flightForm[k])) {
      setFlightError('Please fill in all required fields.')
      return
    }
    if (flightForm.from === flightForm.to) {
      setFlightError('Origin and destination must be different.')
      return
    }

    setFlightSaving(true)
    const payload = {
      ...flightForm,
      duration: Number(flightForm.duration),
      stops: Number(flightForm.stops) || 0,
      priceEconomy: Number(flightForm.priceEconomy),
      priceBusiness: Number(flightForm.priceBusiness),
      seatsLeft: Number(flightForm.seatsLeft) || 50,
    }

    try {
      const { data } = await api.post('/admin/flights', payload)
      const airline = airlineOptions.find((a) => String(a.id) === String(flightForm.airlineId)) || {}
      setFlights((prev) => [
        ...prev,
        {
          id: `fl-${data.id}`,
          flightNo: payload.flightNo,
          from: payload.from,
          to: payload.to,
          priceEconomy: payload.priceEconomy,
          priceBusiness: payload.priceBusiness,
          seatsLeft: payload.seatsLeft,
          airline: { name: airline.name, code: airline.code, color: airline.color },
        },
      ])
    } catch {
      // Demo fallback — add locally so the flow is fully testable offline
      const airline = airlineOptions.find((a) => String(a.id) === String(flightForm.airlineId)) || {}
      setFlights((prev) => [
        ...prev,
        {
          id: `fl-demo-${Date.now()}`,
          flightNo: payload.flightNo,
          from: payload.from,
          to: payload.to,
          priceEconomy: payload.priceEconomy,
          priceBusiness: payload.priceBusiness,
          seatsLeft: payload.seatsLeft,
          airline: { name: airline.name || 'Demo Airline', code: airline.code || '--', color: airline.color || '#2E6FE8' },
        },
      ])
    } finally {
      setFlightSaving(false)
      setShowAddFlight(false)
      setFlightForm(emptyFlightForm)
    }
  }

  async function removeFlight(flight) {
    const confirmed = window.confirm(`Delete flight ${flight.flightNo}? This cannot be undone.`)
    if (!confirmed) return
    try {
      await api.delete(`/admin/flights/${extractNumericId(flight.id)}`)
    } catch {
      // demo fallback: proceed with local removal regardless
    }
    setFlights((prev) => prev.filter((f) => f.id !== flight.id))
  }

  // ---------- Bookings ----------
  async function handleCancelBooking(booking) {
    const confirmed = window.confirm(`Cancel booking ${booking.reference} on the customer's behalf?`)
    if (!confirmed) return

    setCancellingRef(booking.reference)
    setBookingMessage(null)
    try {
      await api.delete(`/admin/bookings/${booking.reference}`)
      setBookings((prev) => prev.map((b) => (b.reference === booking.reference ? { ...b, status: 'cancelled' } : b)))
      setBookingMessage({ type: 'success', text: `Booking ${booking.reference} cancelled and refunded.` })
    } catch (err) {
      const backendMessage = err.response?.data?.message
      if (backendMessage) {
        setBookingMessage({ type: 'error', text: backendMessage })
      } else {
        const all = JSON.parse(localStorage.getItem('skylane_bookings') || '[]')
        const updated = all.map((b) => (b.reference === booking.reference ? { ...b, status: 'cancelled' } : b))
        localStorage.setItem('skylane_bookings', JSON.stringify(updated))
        setBookings((prev) => prev.map((b) => (b.reference === booking.reference ? { ...b, status: 'cancelled' } : b)))
        setBookingMessage({ type: 'success', text: `Booking ${booking.reference} cancelled and refunded.` })
      }
    } finally {
      setCancellingRef(null)
    }
  }

  // ---------- Users ----------
  async function toggleRole(targetUser) {
    if (targetUser.id === user?.id) {
      setUserMessage({ type: 'error', text: "You can't change your own role." })
      return
    }
    const nextRole = targetUser.role === 'admin' ? 'user' : 'admin'
    setUserActionId(targetUser.id)
    setUserMessage(null)
    try {
      await api.patch(`/admin/users/${targetUser.id}/role`, { role: nextRole })
      setUsers((prev) => prev.map((u) => (u.id === targetUser.id ? { ...u, role: nextRole } : u)))
    } catch (err) {
      const backendMessage = err.response?.data?.message
      if (backendMessage) {
        setUserMessage({ type: 'error', text: backendMessage })
      } else {
        setUsers((prev) => prev.map((u) => (u.id === targetUser.id ? { ...u, role: nextRole } : u)))
      }
    } finally {
      setUserActionId(null)
    }
  }

  async function removeUser(targetUser) {
    if (targetUser.id === user?.id) {
      setUserMessage({ type: 'error', text: "You can't delete your own account." })
      return
    }
    const confirmed = window.confirm(`Delete ${targetUser.name}'s account? This cannot be undone.`)
    if (!confirmed) return

    setUserActionId(targetUser.id)
    setUserMessage(null)
    try {
      await api.delete(`/admin/users/${targetUser.id}`)
      setUsers((prev) => prev.filter((u) => u.id !== targetUser.id))
    } catch (err) {
      const backendMessage = err.response?.data?.message
      if (backendMessage) {
        setUserMessage({ type: 'error', text: backendMessage })
      } else {
        setUsers((prev) => prev.filter((u) => u.id !== targetUser.id))
      }
    } finally {
      setUserActionId(null)
    }
  }

  if (loading) return <Loader label="Loading admin data..." />

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="mb-1 font-display text-2xl font-bold text-ink">Admin dashboard</h1>
      <p className="mb-8 text-sm text-slate">Manage flights, bookings, users, and monitor performance.</p>

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={DollarSign} label="Total revenue" value={`$${stats.revenue.toLocaleString()}`} />
        <StatCard icon={TrendingUp} label="Bookings" value={stats.bookingsCount} />
        <StatCard icon={Users} label="Registered users" value={stats.users} />
        <StatCard icon={Plane} label="Active flights" value={stats.flights} />
      </div>

      <div className="mb-6 flex gap-2 border-b border-slate-light/30">
        {['overview', 'bookings', 'flights', 'users', 'airlines'].map((t) => (
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
        <div>
          {bookingMessage && (
            <div className={`mb-4 rounded-lg px-4 py-2.5 text-sm ${bookingMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
              {bookingMessage.text}
            </div>
          )}
          <div className="overflow-x-auto rounded-2xl border border-slate-light/30 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-mist text-xs uppercase tracking-wide text-slate">
                <tr>
                  <th className="px-5 py-3">Reference</th>
                  <th className="px-5 py-3">Route</th>
                  <th className="px-5 py-3">Passengers</th>
                  <th className="px-5 py-3">Total</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-light/20">
                {bookings.length === 0 ? (
                  <tr><td colSpan={6} className="px-5 py-6 text-center text-slate">No bookings yet.</td></tr>
                ) : bookings.map((b) => (
                  <tr key={b.reference}>
                    <td className="px-5 py-3 font-mono">{b.reference}</td>
                    <td className="px-5 py-3">{b.flight?.from} → {b.flight?.to}</td>
                    <td className="px-5 py-3">{b.passengers?.length || 1}</td>
                    <td className="px-5 py-3 font-semibold">${b.total}</td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${b.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {b.status || 'confirmed'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {b.status !== 'cancelled' && (
                        <button
                          onClick={() => handleCancelBooking(b)}
                          disabled={cancellingRef === b.reference}
                          className="flex items-center gap-1 text-xs font-semibold text-red-600 hover:underline disabled:opacity-50"
                        >
                          <XCircle size={13} />
                          {cancellingRef === b.reference ? 'Cancelling...' : 'Cancel'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'flights' && (
        <div>
          <div className="mb-4 flex justify-end">
            <Button onClick={() => setShowAddFlight((v) => !v)} className="gap-2">
              {showAddFlight ? <X size={15} /> : <Plus size={15} />}
              {showAddFlight ? 'Close' : 'Add flight'}
            </Button>
          </div>

          {showAddFlight && (
            <form onSubmit={handleAddFlight} className="mb-6 space-y-4 rounded-2xl border border-slate-light/30 bg-white p-6">
              {flightError && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{flightError}</p>}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Flight number">
                  <input
                    value={flightForm.flightNo}
                    onChange={(e) => setFlightForm((f) => ({ ...f, flightNo: e.target.value }))}
                    placeholder="AL204"
                    className="w-full rounded-lg border border-slate-light/40 px-3 py-2 text-sm"
                  />
                </Field>
                <Field label="Airline">
                  <select
                    value={flightForm.airlineId}
                    onChange={(e) => setFlightForm((f) => ({ ...f, airlineId: e.target.value }))}
                    className="w-full rounded-lg border border-slate-light/40 px-3 py-2 text-sm"
                  >
                    <option value="">Select airline</option>
                    {airlineOptions.map((a) => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Origin">
                  <select
                    value={flightForm.from}
                    onChange={(e) => setFlightForm((f) => ({ ...f, from: e.target.value }))}
                    className="w-full rounded-lg border border-slate-light/40 px-3 py-2 text-sm"
                  >
                    {airports.map((a) => <option key={a.code} value={a.code}>{a.city} ({a.code})</option>)}
                  </select>
                </Field>
                <Field label="Destination">
                  <select
                    value={flightForm.to}
                    onChange={(e) => setFlightForm((f) => ({ ...f, to: e.target.value }))}
                    className="w-full rounded-lg border border-slate-light/40 px-3 py-2 text-sm"
                  >
                    {airports.map((a) => <option key={a.code} value={a.code}>{a.city} ({a.code})</option>)}
                  </select>
                </Field>
                <Field label="Departure time">
                  <input
                    type="datetime-local"
                    value={flightForm.departTime}
                    onChange={(e) => setFlightForm((f) => ({ ...f, departTime: e.target.value }))}
                    className="w-full rounded-lg border border-slate-light/40 px-3 py-2 text-sm"
                  />
                </Field>
                <Field label="Arrival time">
                  <input
                    type="datetime-local"
                    value={flightForm.arriveTime}
                    onChange={(e) => setFlightForm((f) => ({ ...f, arriveTime: e.target.value }))}
                    className="w-full rounded-lg border border-slate-light/40 px-3 py-2 text-sm"
                  />
                </Field>
                <Field label="Duration (hours)">
                  <input
                    type="number" step="0.1" min="0"
                    value={flightForm.duration}
                    onChange={(e) => setFlightForm((f) => ({ ...f, duration: e.target.value }))}
                    className="w-full rounded-lg border border-slate-light/40 px-3 py-2 text-sm"
                  />
                </Field>
                <Field label="Stops">
                  <input
                    type="number" min="0"
                    value={flightForm.stops}
                    onChange={(e) => setFlightForm((f) => ({ ...f, stops: e.target.value }))}
                    className="w-full rounded-lg border border-slate-light/40 px-3 py-2 text-sm"
                  />
                </Field>
                <Field label="Seats available">
                  <input
                    type="number" min="0"
                    value={flightForm.seatsLeft}
                    onChange={(e) => setFlightForm((f) => ({ ...f, seatsLeft: e.target.value }))}
                    className="w-full rounded-lg border border-slate-light/40 px-3 py-2 text-sm"
                  />
                </Field>
                <Field label="Economy price ($)">
                  <input
                    type="number" min="0"
                    value={flightForm.priceEconomy}
                    onChange={(e) => setFlightForm((f) => ({ ...f, priceEconomy: e.target.value }))}
                    className="w-full rounded-lg border border-slate-light/40 px-3 py-2 text-sm"
                  />
                </Field>
                <Field label="Business price ($)">
                  <input
                    type="number" min="0"
                    value={flightForm.priceBusiness}
                    onChange={(e) => setFlightForm((f) => ({ ...f, priceBusiness: e.target.value }))}
                    className="w-full rounded-lg border border-slate-light/40 px-3 py-2 text-sm"
                  />
                </Field>
              </div>
              <Button type="submit" disabled={flightSaving}>
                {flightSaving ? 'Saving...' : 'Save flight'}
              </Button>
            </form>
          )}

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
                      <button onClick={() => removeFlight(f)} className="text-red-500 hover:text-red-700" aria-label="Remove flight">
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'users' && (
        <div>
          {userMessage && (
            <div className={`mb-4 rounded-lg px-4 py-2.5 text-sm ${userMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
              {userMessage.text}
            </div>
          )}
          <div className="overflow-x-auto rounded-2xl border border-slate-light/30 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-mist text-xs uppercase tracking-wide text-slate">
                <tr>
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3">Email</th>
                  <th className="px-5 py-3">Role</th>
                  <th className="px-5 py-3">Joined</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-light/20">
                {users.length === 0 ? (
                  <tr><td colSpan={5} className="px-5 py-6 text-center text-slate">No users found.</td></tr>
                ) : users.map((u) => (
                  <tr key={u.id}>
                    <td className="px-5 py-3">{u.name}</td>
                    <td className="px-5 py-3">{u.email}</td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${u.role === 'admin' ? 'bg-sky-light text-sky-dark' : 'bg-mist text-slate'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => toggleRole(u)}
                          disabled={u.id === user?.id || userActionId === u.id}
                          className="flex items-center gap-1 text-xs font-semibold text-sky hover:underline disabled:opacity-40"
                          title={u.role === 'admin' ? 'Demote to user' : 'Promote to admin'}
                        >
                          {u.role === 'admin' ? <ShieldOff size={13} /> : <ShieldCheck size={13} />}
                          {u.role === 'admin' ? 'Demote' : 'Promote'}
                        </button>
                        <button
                          onClick={() => removeUser(u)}
                          disabled={u.id === user?.id || userActionId === u.id}
                          className="flex items-center gap-1 text-xs font-semibold text-red-600 hover:underline disabled:opacity-40"
                        >
                          <Trash2 size={13} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'airlines' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {(airlineOptions.length ? airlineOptions : mockAirlines).map((a) => (
            <div key={a.id} className="rounded-2xl border border-slate-light/30 bg-white p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg font-display text-xs font-bold text-white" style={{ backgroundColor: a.color }}>
                {a.code}
              </div>
              <h4 className="mt-3 font-semibold text-ink">{a.name}</h4>
              <p className="text-xs text-slate">{a.fleet} {a.rating ? `· Rating ${a.rating}` : ''}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate">{label}</label>
      {children}
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
