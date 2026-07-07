import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeftRight, Search, Calendar, Users } from 'lucide-react'
import { airports } from '../../data/mockData.js'
import { useBooking } from '../../context/BookingContext.jsx'

const tripTypes = [
  { id: 'oneway', label: 'One way' },
  { id: 'roundtrip', label: 'Round trip' },
]

export default function FlightSearchForm() {
  const navigate = useNavigate()
  const { searchParams, setSearchParams } = useBooking()
  const [form, setForm] = useState(searchParams)

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function swap() {
    setForm((f) => ({ ...f, from: f.to, to: f.from }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    setSearchParams(form)
    navigate('/search')
  }

  return (
    <div className="relative z-10 mx-auto -mt-28 max-w-6xl px-4 sm:px-6 lg:px-8">
      <form onSubmit={handleSubmit} className="ticket-stub shadow-ticket p-5 sm:p-8">
        <div className="mb-5 flex gap-2">
          {tripTypes.map((t) => (
            <button
              type="button"
              key={t.id}
              onClick={() => update('tripType', t.id)}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                form.tripType === t.id ? 'bg-sky text-white' : 'bg-mist text-slate hover:bg-sky-light'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-12 md:items-end">
          <div className="md:col-span-3">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate">From</label>
            <select
              value={form.from}
              onChange={(e) => update('from', e.target.value)}
              className="w-full rounded-lg border border-slate-light/40 bg-white px-3 py-2.5 text-sm font-medium text-ink focus:border-sky"
            >
              {airports.map((a) => (
                <option key={a.code} value={a.code}>{a.city} ({a.code})</option>
              ))}
            </select>
          </div>

          <div className="flex justify-center md:col-span-1">
            <button
              type="button"
              onClick={swap}
              aria-label="Swap origin and destination"
              className="mt-4 flex h-9 w-9 items-center justify-center rounded-full border border-slate-light/40 text-sky hover:bg-sky-light md:mt-0"
            >
              <ArrowLeftRight size={16} />
            </button>
          </div>

          <div className="md:col-span-3">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate">To</label>
            <select
              value={form.to}
              onChange={(e) => update('to', e.target.value)}
              className="w-full rounded-lg border border-slate-light/40 bg-white px-3 py-2.5 text-sm font-medium text-ink focus:border-sky"
            >
              {airports.map((a) => (
                <option key={a.code} value={a.code}>{a.city} ({a.code})</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate">
              <Calendar size={12} /> Depart
            </label>
            <input
              type="date"
              value={form.departDate}
              onChange={(e) => update('departDate', e.target.value)}
              className="w-full rounded-lg border border-slate-light/40 bg-white px-3 py-2.5 text-sm font-medium text-ink focus:border-sky"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate">
              <Users size={12} /> Passengers
            </label>
            <select
              value={form.passengers}
              onChange={(e) => update('passengers', Number(e.target.value))}
              className="w-full rounded-lg border border-slate-light/40 bg-white px-3 py-2.5 text-sm font-medium text-ink focus:border-sky"
            >
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>{n} {n === 1 ? 'passenger' : 'passengers'}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-1">
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-sunrise py-2.5 text-sm font-bold text-navy transition hover:bg-sunrise-dark hover:text-white"
            >
              <Search size={16} />
              <span className="md:hidden">Search flights</span>
            </button>
          </div>
        </div>

        <div className="mt-4 flex gap-4 border-t border-dashed border-slate-light/40 pt-4 text-sm">
          {['economy', 'business'].map((c) => (
            <label key={c} className="flex items-center gap-2 text-slate">
              <input
                type="radio"
                name="cabin"
                checked={form.cabin === c}
                onChange={() => update('cabin', c)}
                className="accent-sky"
              />
              <span className="capitalize">{c}</span>
            </label>
          ))}
        </div>
      </form>
    </div>
  )
}
