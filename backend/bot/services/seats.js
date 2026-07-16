const COLS = ['A', 'B', 'C', 'D', 'E', 'F']
const ROWS = 20

/**
 * Generates a seat map the same shape as the website's (rows 1-20, business
 * up to row 4). Seats aren't tracked per-flight in the schema, so — same as
 * the website — this is a fresh, randomized layout per booking session
 * rather than real shared inventory across bookings.
 */
export function generateSeatLayout() {
  const seats = []
  for (let r = 1; r <= ROWS; r++) {
    for (const c of COLS) {
      const isBusiness = r <= 4
      seats.push({
        id: `${r}${c}`,
        row: r,
        col: c,
        type: isBusiness ? 'business' : 'economy',
        price: isBusiness ? 120 : r <= 8 ? 35 : 0,
        status: Math.random() < 0.18 ? 'taken' : 'available',
      })
    }
  }
  return seats
}

export function seatById(layout, id) {
  return layout.find((s) => s.id === id)
}
