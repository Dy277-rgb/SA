import { Plane } from 'lucide-react'

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-navy pb-40 pt-16 sm:pt-24">
      <div className="pointer-events-none absolute inset-0 opacity-20">
        <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-sky blur-3xl" />
        <div className="absolute right-0 top-1/3 h-72 w-72 rounded-full bg-sunrise blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-block rounded-full bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-sunrise">
            500+ destinations, one boarding pass away
          </span>
          <h1 className="mt-6 font-display text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
            Chart your next
            <span className="text-sky"> flight path</span>
          </h1>
          <p className="mt-5 text-base text-white/70 sm:text-lg">
            Compare fares across 40+ airlines, lock in your seat, and board with confidence — all in one place.
          </p>
        </div>

        {/* Signature: animated flight path arc with plane icon */}
        <div className="relative mx-auto mt-14 hidden max-w-3xl items-center justify-between sm:flex">
          <span className="font-mono text-sm font-semibold text-white/60">JFK</span>
          <div className="relative mx-4 h-16 flex-1">
            <svg viewBox="0 0 400 60" className="h-full w-full" preserveAspectRatio="none" aria-hidden="true">
              <path
                d="M0,50 Q200,-10 400,50"
                fill="none"
                stroke="rgba(255,255,255,0.25)"
                strokeWidth="2"
                strokeDasharray="6,8"
              />
            </svg>
            <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 motion-safe:animate-bounce">
              <Plane size={22} className="text-sunrise rotate-45" />
            </div>
          </div>
          <span className="font-mono text-sm font-semibold text-white/60">LHR</span>
        </div>
      </div>
    </section>
  )
}
