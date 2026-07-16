import pool from '../../config/db.js'

const FLIGHT_TEMPLATES = [
  { airlineCode: 'AL', duration: 5, stops: 0, priceEconomy: 320, priceBusiness: 980, departTime: '06:15' },
  { airlineCode: 'MA', duration: 7.5, stops: 1, priceEconomy: 275, priceBusiness: 890, departTime: '09:40' },
  { airlineCode: 'NW', duration: 6, stops: 0, priceEconomy: 350, priceBusiness: 1050, departTime: '13:20' },
  { airlineCode: 'ZG', duration: 8, stops: 1, priceEconomy: 260, priceBusiness: 860, departTime: '18:05' },
  { airlineCode: 'AL', duration: 5.5, stops: 0, priceEconomy: 340, priceBusiness: 1000, departTime: '21:50' },
]

function toMySQLDateTime(date) {
  return date.toISOString().slice(0, 19).replace('T', ' ')
}

/**
 * Auto-seeds a handful of realistic flights for a route + date if none
 * exist yet, so the bot (and the website) always have something bookable
 * without requiring an admin to manually add every route in advance.
 */
async function seedFlightsForRoute(from, to, dateStr) {
  const [airlineRows] = await pool.query('SELECT id, code FROM airlines')
  const airlineByCode = Object.fromEntries(airlineRows.map((a) => [a.code, a.id]))

  for (let i = 0; i < FLIGHT_TEMPLATES.length; i++) {
    const t = FLIGHT_TEMPLATES[i]
    const airlineId = airlineByCode[t.airlineCode]
    if (!airlineId) continue

    const [h, m] = t.departTime.split(':').map(Number)
    const depart = new Date(`${dateStr}T00:00:00`)
    depart.setHours(h, m, 0, 0)
    const arrive = new Date(depart.getTime() + t.duration * 60 * 60 * 1000)

    const flightNo = `${t.airlineCode}${100 + i * 37 + depart.getDate()}`

    await pool.query(
      `INSERT INTO flights
        (flight_no, airline_id, origin_code, destination_code, depart_time, arrive_time, duration_hours, stops, price_economy, price_business, seats_left)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [flightNo, airlineId, from, to, toMySQLDateTime(depart), toMySQLDateTime(arrive), t.duration, t.stops, t.priceEconomy, t.priceBusiness, 40]
    )
  }
}

export async function searchFlights(from, to, dateStr) {
  const query = `
    SELECT f.*, a.name AS airline_name, a.code AS airline_code
    FROM flights f
    JOIN airlines a ON a.id = f.airline_id
    WHERE f.origin_code = ? AND f.destination_code = ? AND DATE(f.depart_time) = ?
      AND f.seats_left > 0
    ORDER BY f.price_economy ASC
  `
  let [rows] = await pool.query(query, [from, to, dateStr])

  if (rows.length === 0) {
    await seedFlightsForRoute(from, to, dateStr)
    ;[rows] = await pool.query(query, [from, to, dateStr])
  }

  return rows.map((r) => ({
    id: r.id,
    flightNo: r.flight_no,
    from: r.origin_code,
    to: r.destination_code,
    departTime: r.depart_time,
    arriveTime: r.arrive_time,
    duration: Number(r.duration_hours),
    stops: r.stops,
    priceEconomy: Number(r.price_economy),
    priceBusiness: Number(r.price_business),
    seatsLeft: r.seats_left,
    airlineName: r.airline_name,
    airlineCode: r.airline_code,
  }))
}

export async function listAirports() {
  const [rows] = await pool.query('SELECT code, city, country FROM airports ORDER BY city')
  return rows
}
