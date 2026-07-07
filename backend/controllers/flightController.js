import pool from '../config/db.js'

export async function searchFlights(req, res) {
  const { from, to, departDate } = req.query

  try {
    let query = `
      SELECT f.*, a.name AS airline_name, a.code AS airline_code, a.color AS airline_color, a.fleet AS airline_fleet, a.rating AS airline_rating
      FROM flights f
      JOIN airlines a ON a.id = f.airline_id
      WHERE 1 = 1
    `
    const params = []

    if (from) {
      query += ' AND f.origin_code = ?'
      params.push(from)
    }
    if (to) {
      query += ' AND f.destination_code = ?'
      params.push(to)
    }
    if (departDate) {
      query += ' AND DATE(f.depart_time) = ?'
      params.push(departDate)
    }

    query += ' ORDER BY f.price_economy ASC'

    const [rows] = await pool.query(query, params)

    const flights = rows.map((r) => ({
      id: `fl-${r.id}`,
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
      airline: {
        id: `al-${r.airline_id}`,
        name: r.airline_name,
        code: r.airline_code,
        color: r.airline_color,
        fleet: r.airline_fleet,
        rating: Number(r.airline_rating),
      },
    }))

    res.json({ flights })
  } catch (err) {
    res.status(500).json({ message: 'Failed to search flights', error: err.message })
  }
}

export async function listAirports(req, res) {
  try {
    const [rows] = await pool.query('SELECT code, city, country FROM airports ORDER BY city')
    res.json({ airports: rows })
  } catch (err) {
    res.status(500).json({ message: 'Failed to list airports', error: err.message })
  }
}

export async function listAirlines(req, res) {
  try {
    const [rows] = await pool.query('SELECT id, code, name, fleet, rating, color FROM airlines')
    res.json({ airlines: rows })
  } catch (err) {
    res.status(500).json({ message: 'Failed to list airlines', error: err.message })
  }
}
