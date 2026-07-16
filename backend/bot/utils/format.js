export function formatTime(dateLike) {
  return new Date(dateLike).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function formatDate(dateLike) {
  return new Date(dateLike).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
}

export function formatDuration(hours) {
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  return `${h}h${m ? ' ' + m + 'm' : ''}`
}

export function flightSummary(flight) {
  return (
    `✈️ ${flight.airlineName} ${flight.flightNo}\n` +
    `${flight.from} ${formatTime(flight.departTime)} → ${flight.to} ${formatTime(flight.arriveTime)}\n` +
    `${formatDuration(flight.duration)} · ${flight.stops === 0 ? 'Nonstop' : flight.stops + ' stop'}`
  )
}
