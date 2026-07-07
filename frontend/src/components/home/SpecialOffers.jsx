import { Tag } from 'lucide-react'
import { specialOffers } from '../../data/mockData.js'

export default function SpecialOffers() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-10">
        <span className="text-xs font-semibold uppercase tracking-widest text-sky">Limited time</span>
        <h2 className="mt-2 font-display text-3xl font-bold text-ink">Special offers</h2>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {specialOffers.map((o) => (
          <div key={o.id} className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${o.color} p-6 text-white shadow-card`}>
            <Tag className="absolute -right-2 -top-2 h-24 w-24 text-white/10" />
            <span className="inline-block rounded-full bg-white/15 px-3 py-1 text-xs font-bold">{o.discount}</span>
            <h3 className="mt-4 font-display text-xl font-bold">{o.title}</h3>
            <p className="mt-1 text-sm text-white/80">{o.subtitle}</p>
            <div className="mt-6 flex items-center justify-between border-t border-white/20 pt-4 text-xs">
              <span className="font-mono font-semibold">{o.route}</span>
              <span className="text-white/70">Ends {new Date(o.validUntil).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
