import pool from '../config/db.js'

export async function allBookings(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT b.*, f.flight_no, f.origin_code, f.destination_code, f.depart_time
       FROM bookings b JOIN flights f ON f.id = b.flight_id
       ORDER BY b.created_at DESC LIMIT 200`
    )
    const bookings = rows.map((b) => ({
      reference: b.reference,
      total: Number(b.total),
      status: b.status,
      userId: b.user_id,
      passengers: [],
      flight: { from: b.origin_code, to: b.destination_code, departTime: b.depart_time },
    }))
    res.json({ bookings })
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch bookings', error: err.message })
  }
}

export async function allFlights(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT f.*, a.name AS airline_name, a.code AS airline_code, a.color AS airline_color
       FROM flights f JOIN airlines a ON a.id = f.airline_id
       ORDER BY f.depart_time ASC`
    )
    const flights = rows.map((r) => ({
      id: `fl-${r.id}`,
      flightNo: r.flight_no,
      from: r.origin_code,
      to: r.destination_code,
      priceEconomy: Number(r.price_economy),
      priceBusiness: Number(r.price_business),
      seatsLeft: r.seats_left,
      airline: { name: r.airline_name, code: r.airline_code, color: r.airline_color },
    }))
    res.json({ flights })
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch flights', error: err.message })
  }
}

export async function createFlight(req, res) {
  const { flightNo, airlineId, from, to, departTime, arriveTime, duration, stops, priceEconomy, priceBusiness, seatsLeft } = req.body
  try {
    const [result] = await pool.query(
      `INSERT INTO flights (flight_no, airline_id, origin_code, destination_code, depart_time, arrive_time, duration_hours, stops, price_economy, price_business, seats_left)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [flightNo, airlineId, from, to, departTime, arriveTime, duration, stops || 0, priceEconomy, priceBusiness, seatsLeft || 50]
    )
    res.status(201).json({ id: result.insertId })
  } catch (err) {
    res.status(500).json({ message: 'Failed to create flight', error: err.message })
  }
}

export async function deleteFlight(req, res) {
  const id = req.params.id
  try {
    await pool.query('DELETE FROM flights WHERE id = ?', [id])
    res.json({ message: 'Flight deleted' })
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete flight', error: err.message })
  }
}

export async function stats(req, res) {
  try {
    const [[{ totalRevenue }]] = await pool.query(`SELECT COALESCE(SUM(total), 0) AS totalRevenue FROM bookings WHERE status = 'confirmed'`)
    const [[{ totalBookings }]] = await pool.query(`SELECT COUNT(*) AS totalBookings FROM bookings`)
    const [[{ totalUsers }]] = await pool.query(`SELECT COUNT(*) AS totalUsers FROM users WHERE role = 'user'`)
    const [[{ totalFlights }]] = await pool.query(`SELECT COUNT(*) AS totalFlights FROM flights`)
    res.json({ totalRevenue: Number(totalRevenue), totalBookings, totalUsers, totalFlights })
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch stats', error: err.message })
  }
}

export async function listUsers(req, res) {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, email, role, created_at AS createdAt FROM users ORDER BY created_at DESC'
    )
    res.json({ users: rows })
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch users', error: err.message })
  }
}

export async function updateUserRole(req, res) {
  const { id } = req.params
  const { role } = req.body

  if (!['user', 'admin'].includes(role)) {
    return res.status(400).json({ message: 'Role must be "user" or "admin"' })
  }
  if (Number(id) === req.user.id) {
    return res.status(400).json({ message: "You can't change your own role" })
  }

  try {
    const [result] = await pool.query('UPDATE users SET role = ? WHERE id = ?', [role, id])
    if (result.affectedRows === 0) return res.status(404).json({ message: 'User not found' })
    res.json({ message: 'Role updated' })
  } catch (err) {
    res.status(500).json({ message: 'Failed to update role', error: err.message })
  }
}

export async function deleteUser(req, res) {
  const { id } = req.params

  if (Number(id) === req.user.id) {
    return res.status(400).json({ message: "You can't delete your own account" })
  }

  try {
    const [result] = await pool.query('DELETE FROM users WHERE id = ?', [id])
    if (result.affectedRows === 0) return res.status(404).json({ message: 'User not found' })
    res.json({ message: 'User deleted' })
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete user', error: err.message })
  }
}

export async function adminCancelBooking(req, res) {
  const { reference } = req.params

  const conn = await pool.getConnection()
  try {
    const [rows] = await conn.query('SELECT * FROM bookings WHERE reference = ?', [reference])
    const booking = rows[0]

    if (!booking) return res.status(404).json({ message: 'Booking not found' })
    if (booking.status === 'cancelled') {
      return res.status(400).json({ message: 'This booking is already cancelled' })
    }

    await conn.beginTransaction()

    await conn.query(`UPDATE bookings SET status = 'cancelled' WHERE id = ?`, [booking.id])

    const [[{ passengerCount }]] = await conn.query(
      'SELECT COUNT(*) AS passengerCount FROM booking_passengers WHERE booking_id = ?',
      [booking.id]
    )
    if (booking.flight_id) {
      await conn.query('UPDATE flights SET seats_left = seats_left + ? WHERE id = ?', [
        passengerCount,
        booking.flight_id,
      ])
    }
    await conn.query(`UPDATE payments SET status = 'refunded' WHERE booking_id = ?`, [booking.id])

    await conn.commit()
    res.json({ message: 'Booking cancelled by admin. Refund initiated.', reference })
  } catch (err) {
    await conn.rollback()
    res.status(500).json({ message: 'Cancellation failed', error: err.message })
  } finally {
    conn.release()
  }
}
