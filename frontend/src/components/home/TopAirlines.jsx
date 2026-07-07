import { Star } from 'lucide-react'
import { airlines } from '../../data/mockData.js'

export default function TopAirlines() {
  return (
    <section className="bg-white py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <span className="text-xs font-semibold uppercase tracking-widest text-sky">Trusted partners</span>
          <h2 className="mt-2 font-display text-3xl font-bold text-ink">Top rated airlines</h2>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {airlines.map((a) => (
            <div key={a.id} className="rounded-2xl border border-slate-light/30 p-6 transition hover:shadow-card">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-xl font-display text-sm font-bold text-white"
                style={{ backgroundColor: a.color }}
              >
                {a.code}
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold text-ink">{a.name}</h3>
              <p className="text-sm text-slate">{a.fleet}</p>
              <div className="mt-3 flex items-center gap-1 text-sunrise">
                <Star size={14} fill="currentColor" />
                <span className="text-sm font-semibold text-ink">{a.rating}</span>
                <span className="text-xs text-slate">/ 5</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
