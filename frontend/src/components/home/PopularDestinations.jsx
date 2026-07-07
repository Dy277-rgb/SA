import { useNavigate } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { popularDestinations } from '../../data/mockData.js'
import { useBooking } from '../../context/BookingContext.jsx'

export default function PopularDestinations() {
  const navigate = useNavigate()
  const { setSearchParams, searchParams } = useBooking()

  function goSearch(dest) {
    setSearchParams({ ...searchParams, to: dest.code })
    navigate('/search')
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-10 flex items-end justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-sky">Trending now</span>
          <h2 className="mt-2 font-display text-3xl font-bold text-ink">Popular destinations</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {popularDestinations.map((d) => (
          <button
            key={d.id}
            onClick={() => goSearch(d)}
            className="group relative overflow-hidden rounded-2xl text-left shadow-card transition hover:-translate-y-1"
          >
            <img
              src={d.image}
              alt={`${d.city}, ${d.country}`}
              className="h-56 w-full object-cover transition duration-500 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-navy/85 via-navy/10 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-5">
              <div>
                <h3 className="font-display text-xl font-bold text-white">{d.city}</h3>
                <p className="text-sm text-white/70">{d.country}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-white/60">from</p>
                <p className="font-mono text-lg font-bold text-sunrise">${d.price}</p>
              </div>
            </div>
            <span className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-navy opacity-0 transition group-hover:opacity-100">
              <ArrowUpRight size={16} />
            </span>
          </button>
        ))}
      </div>
    </section>
  )
}
