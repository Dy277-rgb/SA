const COLS = ['A', 'B', 'C', 'D', 'E', 'F']

export default function SeatMap({ seats, selectedSeats, onToggle, maxSeats }) {
  const rows = [...new Set(seats.map((s) => s.row))].sort((a, b) => a - b)

  function isSelected(seat) {
    return selectedSeats.some((s) => s.id === seat.id)
  }

  function seatClasses(seat) {
    if (seat.status === 'taken') return 'bg-slate-light/30 text-slate-light cursor-not-allowed'
    if (isSelected(seat)) return 'bg-sky text-white border-sky'
    if (seat.type === 'business') return 'bg-sunrise/10 text-sunrise-dark border-sunrise/40 hover:bg-sunrise/20'
    return 'bg-white text-ink border-slate-light/40 hover:border-sky hover:bg-sky-light'
  }

  function handleClick(seat) {
    if (seat.status === 'taken') return
    if (!isSelected(seat) && selectedSeats.length >= maxSeats) return
    onToggle(seat)
  }

  return (
    <div className="seat-scroll overflow-x-auto">
      <div className="mx-auto w-fit min-w-full">
        <div className="mb-4 flex justify-center gap-6 text-xs text-slate">
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded border border-slate-light/40 bg-white" /> Available</span>
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded border border-sunrise/40 bg-sunrise/10" /> Business</span>
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-sky" /> Selected</span>
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-slate-light/30" /> Taken</span>
        </div>

        <div className="mb-2 flex justify-center gap-2 pl-8">
          {COLS.map((c) => (
            <span key={c} className={`w-9 text-center text-xs font-semibold text-slate-light ${(c === 'C') ? 'mr-3' : ''}`}>{c}</span>
          ))}
        </div>

        {rows.map((row) => {
          const rowSeats = seats.filter((s) => s.row === row).sort((a, b) => COLS.indexOf(a.col) - COLS.indexOf(b.col))
          const isBusinessRow = rowSeats[0]?.type === 'business'
          return (
            <div key={row} className="mb-2 flex items-center justify-center gap-2">
              <span className="w-6 text-xs font-semibold text-slate-light">{row}</span>
              {rowSeats.map((seat) => (
                <button
                  type="button"
                  key={seat.id}
                  onClick={() => handleClick(seat)}
                  disabled={seat.status === 'taken'}
                  title={`Seat ${seat.id} · ${seat.type}${seat.price ? ` · +$${seat.price}` : ''}`}
                  className={`flex h-9 w-9 items-center justify-center rounded-md border text-[11px] font-semibold transition ${seatClasses(seat)} ${seat.aisle ? 'mr-3' : ''}`}
                >
                  {seat.col}
                </button>
              ))}
            </div>
          )
        })}
        {rows.length > 0 && (
          <p className="mt-2 text-center text-xs text-slate-light">Row {rows[3]} — Economy starts</p>
        )}
      </div>
    </div>
  )
}
