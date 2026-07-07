import { Clock, Plane } from 'lucide-react'

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function formatDuration(hours) {
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  return `${h}h ${m ? m + 'm' : ''}`.trim()
}

export default function FlightCard({ flight, cabin, onSelect }) {
  const price = cabin === 'business' ? flight.priceBusiness : flight.priceEconomy

  return (
    <div className="ticket-stub shadow-card grid grid-cols-1 items-center gap-4 p-5 sm:grid-cols-12 sm:gap-2 sm:p-6">
      <div className="sm:col-span-3">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-lg font-display text-xs font-bold text-white"
            style={{ backgroundColor: flight.airline.color }}
          >
            {flight.airline.code}
          </div>
          <div>
            <p className="text-sm font-semibold text-ink">{flight.airline.name}</p>
            <p className="font-mono text-xs text-slate">{flight.flightNo}</p>
          </div>
        </div>
      </div>

      <div className="sm:col-span-5">
        <div className="flex items-center justify-between gap-2">
          <div className="text-center">
            <p className="font-display text-lg font-bold text-ink">{formatTime(flight.departTime)}</p>
            <p className="text-xs text-slate">{flight.from}</p>
          </div>
          <div className="flex flex-1 flex-col items-center px-2">
            <span className="flex items-center gap-1 text-xs text-slate-light">
              <Clock size={12} /> {formatDuration(flight.duration)}
            </span>
            <div className="flight-path-line my-1.5 h-px w-full" />
            <span className="text-xs text-slate-light">
              {flight.stops === 0 ? 'Nonstop' : `${flight.stops} stop`}
            </span>
          </div>
          <div className="text-center">
            <p className="font-display text-lg font-bold text-ink">{formatTime(flight.arriveTime)}</p>
            <p className="text-xs text-slate">{flight.to}</p>
          </div>
        </div>
      </div>

      <div className="ticket-divider sm:col-span-2 sm:pl-4 sm:text-center">
        <p className="font-mono text-2xl font-bold text-sky">${price}</p>
        <p className="text-xs text-slate-light">{flight.seatsLeft} seats left</p>
      </div>

      <div className="sm:col-span-2">
        <button
          onClick={() => onSelect(flight)}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-sunrise py-2.5 text-sm font-bold text-navy transition hover:bg-sunrise-dark hover:text-white"
        >
          Select <Plane size={14} className="-rotate-45" />
        </button>
      </div>
    </div>
  )
}
