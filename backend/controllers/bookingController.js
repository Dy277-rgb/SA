import pool from '../config/db.js'

function extractFlightId(flightId) {
  const match = String(flightId).match(/(\d+)$/)
  return match ? Number(match[1]) : null
}

export async function createBooking(req, res) {
  const { flight, searchParams, seats, passengers, total, reference } = req.body
  const userId = req.user?.id

  if (!flight || !seats?.length || !passengers?.length || !reference) {
    return res.status(400).json({ message: 'Missing booking details' })
  }

  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()

    const flightId = extractFlightId(flight.id)

    const [bookingResult] = await conn.query(
      `INSERT INTO bookings (reference, user_id, flight_id, cabin, total, status)
       VALUES (?, ?, ?, ?, ?, 'confirmed')`,
      [reference, userId, flightId, searchParams?.cabin || 'economy', total]
    )
    const bookingId = bookingResult.insertId

    for (let i = 0; i < passengers.length; i++) {
      const p = passengers[i]
      const seat = seats[i]
      await conn.query(
        `INSERT INTO booking_passengers (booking_id, first_name, last_name, dob, passport, seat_id)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [bookingId, p.firstName, p.lastName, p.dob, p.passport, seat?.id || '']
      )
    }

    await conn.query(
      `INSERT INTO payments (booking_id, method, amount, status) VALUES (?, 'card', ?, 'paid')`,
      [bookingId, total]
    )

    if (flightId) {
      await conn.query(
        `UPDATE flights SET seats_left = GREATEST(seats_left - ?, 0) WHERE id = ?`,
        [passengers.length, flightId]
      )
    }

    await conn.commit()
    res.status(201).json({ reference, bookingId })
  } catch (err) {
    await conn.rollback()
    res.status(500).json({ message: 'Booking failed', error: err.message })
  } finally {
    conn.release()
  }
}

const FREE_CANCELLATION_HOURS = 24

export async function cancelBooking(req, res) {
  const { reference } = req.params
  const userId = req.user.id

  const conn = await pool.getConnection()
  try {
    const [rows] = await conn.query(
      `SELECT b.*, TIMESTAMPDIFF(HOUR, b.created_at, NOW()) AS hoursSinceBooking
       FROM bookings b
       WHERE b.reference = ? AND b.user_id = ?`,
      [reference, userId]
    )
    const booking = rows[0]

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' })
    }
    if (booking.status === 'cancelled') {
      return res.status(400).json({ message: 'This booking is already cancelled' })
    }
    if (booking.hoursSinceBooking >= FREE_CANCELLATION_HOURS) {
      return res.status(400).json({
        message: `The 24-hour free cancellation window has passed for this booking`,
      })
    }

    await conn.beginTransaction()

    await conn.query(`UPDATE bookings SET status = 'cancelled' WHERE id = ?`, [booking.id])

    const [[{ passengerCount }]] = await conn.query(
      `SELECT COUNT(*) AS passengerCount FROM booking_passengers WHERE booking_id = ?`,
      [booking.id]
    )
    if (booking.flight_id) {
      await conn.query(`UPDATE flights SET seats_left = seats_left + ? WHERE id = ?`, [
        passengerCount,
        booking.flight_id,
      ])
    }

    await conn.query(`UPDATE payments SET status = 'refunded' WHERE booking_id = ?`, [booking.id])

    await conn.commit()
    res.json({ message: 'Booking cancelled. Your refund has been initiated.', reference })
  } catch (err) {
    await conn.rollback()
    res.status(500).json({ message: 'Cancellation failed', error: err.message })
  } finally {
    conn.release()
  }
}

export async function myBookings(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT b.*, f.flight_no, f.origin_code, f.destination_code, f.depart_time, f.arrive_time
       FROM bookings b
       JOIN flights f ON f.id = b.flight_id
       WHERE b.user_id = ?
       ORDER BY b.created_at DESC`,
      [req.user.id]
    )

    const bookings = await Promise.all(
      rows.map(async (b) => {
        const [passengers] = await pool.query(
          'SELECT first_name AS firstName, last_name AS lastName, dob, passport, seat_id AS seatId FROM booking_passengers WHERE booking_id = ?',
          [b.id]
        )
        return {
          reference: b.reference,
          total: Number(b.total),
          status: b.status,
          userId: b.user_id,
          createdAt: b.created_at,
          flight: {
            from: b.origin_code,
            to: b.destination_code,
            departTime: b.depart_time,
            arriveTime: b.arrive_time,
          },
          seats: passengers.map((p) => ({ id: p.seatId })),
          passengers,
        }
      })
    )

    res.json({ bookings })
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch bookings', error: err.message })
  }
}
