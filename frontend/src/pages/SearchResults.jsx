import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SlidersHorizontal } from 'lucide-react'
import { useBooking } from '../context/BookingContext.jsx'
import { generateFlights, airlines } from '../data/mockData.js'
import FlightCard from '../components/flights/FlightCard.jsx'
import Loader from '../components/common/Loader.jsx'
import api from '../api/axios.js'

export default function SearchResults() {
  const { searchParams, setSearchParams, setSelectedFlight } = useBooking()
  const navigate = useNavigate()
  const [flights, setFlights] = useState([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState('price')
  const [maxPrice, setMaxPrice] = useState(2000)
  const [airlineFilter, setAirlineFilter] = useState('all')

  useEffect(() => {
    let active = true
    setLoading(true)
    ;(async () => {
      try {
        const { data } = await api.get('/flights/search', { params: searchParams })
        if (active) setFlights(data.flights)
      } catch {
        // Demo fallback
        if (active) setFlights(generateFlights(searchParams))
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => { active = false }
  }, [searchParams])

  const filtered = useMemo(() => {
    let list = flights.filter((f) => {
      const price = searchParams.cabin === 'business' ? f.priceBusiness : f.priceEconomy
      const airlineOk = airlineFilter === 'all' || f.airline.id === airlineFilter
      return price <= maxPrice && airlineOk
    })
    list.sort((a, b) => {
      const priceA = searchParams.cabin === 'business' ? a.priceBusiness : a.priceEconomy
      const priceB = searchParams.cabin === 'business' ? b.priceBusiness : b.priceEconomy
      if (sortBy === 'price') return priceA - priceB
      if (sortBy === 'duration') return a.duration - b.duration
      return new Date(a.departTime) - new Date(b.departTime)
    })
    return list
  }, [flights, sortBy, maxPrice, airlineFilter, searchParams.cabin])

  function handleSelect(flight) {
    setSelectedFlight(flight)
    navigate('/booking/seats')
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">
            {searchParams.from} → {searchParams.to}
          </h1>
          <p className="text-sm text-slate">
            {new Date(searchParams.departDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
            {' · '}{searchParams.passengers} passenger{searchParams.passengers > 1 ? 's' : ''}
            {' · '}<span className="capitalize">{searchParams.cabin}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
        <aside className="lg:col-span-1">
          <div className="rounded-2xl border border-slate-light/30 bg-white p-5">
            <h3 className="mb-4 flex items-center gap-2 font-display text-sm font-semibold text-ink">
              <SlidersHorizontal size={15} /> Filters
            </h3>

            <div className="mb-5">
              <label className="mb-2 flex justify-between text-xs font-semibold uppercase tracking-wide text-slate">
                <span>Max price</span><span>${maxPrice}</span>
              </label>
              <input
                type="range"
                min={100}
                max={2000}
                step={50}
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-sky"
              />
            </div>

            <div className="mb-5">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate">Sort by</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full rounded-lg border border-slate-light/40 px-3 py-2 text-sm"
              >
                <option value="price">Price (lowest)</option>
                <option value="duration">Duration (shortest)</option>
                <option value="departure">Departure time</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate">Airline</label>
              <select
                value={airlineFilter}
                onChange={(e) => setAirlineFilter(e.target.value)}
                className="w-full rounded-lg border border-slate-light/40 px-3 py-2 text-sm"
              >
                <option value="all">All airlines</option>
                {airlines.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
          </div>
        </aside>

        <div className="space-y-4 lg:col-span-3">
          {loading ? (
            <Loader label="Searching flights..." />
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-light/50 p-10 text-center text-slate">
              No flights match your filters. Try widening your search.
            </div>
          ) : (
            filtered.map((f) => (
              <FlightCard key={f.id} flight={f} cabin={searchParams.cabin} onSelect={handleSelect} />
            ))
          )}
        </div>
      </div>
    </div>
  )
}
