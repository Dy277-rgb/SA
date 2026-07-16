import bcrypt from 'bcryptjs'
import pool from '../../config/db.js'

function generateReference() {
  return 'SL' + Math.random().toString(36).slice(2, 8).toUpperCase()
}

/**
 * Finds the SkyLane user linked to this Telegram chat, or auto-creates a
 * lightweight account tied to the chat ID. This is the "simplest approach"
 * for linking: no password ever needs to be typed inside Telegram. The
 * account can later be merged with a real web account via /link.
 */
export async function getOrCreateTelegramUser(ctx) {
  const chatId = ctx.chat.id
  const [existing] = await pool.query('SELECT * FROM users WHERE telegram_chat_id = ?', [chatId])
  if (existing[0]) return existing[0]

  const displayName = [ctx.from.first_name, ctx.from.last_name].filter(Boolean).join(' ') || ctx.from.username || 'Telegram User'
  const syntheticEmail = `tg${chatId}@skylane.telegram`
  const randomPasswordHash = await bcrypt.hash(Math.random().toString(36), 10)

  const [result] = await pool.query(
    `INSERT INTO users (name, email, password_hash, role, telegram_chat_id) VALUES (?, ?, ?, 'user', ?)`,
    [displayName, syntheticEmail, randomPasswordHash, chatId]
  )

  const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [result.insertId])
  return rows[0]
}

/**
 * Links this Telegram chat to an existing SkyLane web account, so bookings
 * made via the bot also show up in that account's web dashboard.
 */
export async function linkTelegramToAccount(chatId, email, password) {
  const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email])
  const record = rows[0]
  if (!record) return { success: false, message: "No SkyLane account found with that email." }

  const match = await bcrypt.compare(password, record.password_hash)
  if (!match) return { success: false, message: 'Incorrect password.' }

  const [taken] = await pool.query('SELECT id FROM users WHERE telegram_chat_id = ? AND id != ?', [chatId, record.id])
  if (taken.length) {
    return { success: false, message: 'This Telegram account is already linked elsewhere.' }
  }

  await pool.query('UPDATE users SET telegram_chat_id = ? WHERE id = ?', [chatId, record.id])
  return { success: true, user: record }
}

export async function createBooking({ userId, flight, cabin, seats, passengers }) {
  const fareTotal = (cabin === 'business' ? flight.priceBusiness : flight.priceEconomy) * passengers.length
  const seatTotal = seats.reduce((sum, s) => sum + s.price, 0)
  const total = fareTotal + seatTotal
  const reference = generateReference()

  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()

    const [bookingResult] = await conn.query(
      `INSERT INTO bookings (reference, user_id, flight_id, cabin, total, status) VALUES (?, ?, ?, ?, ?, 'confirmed')`,
      [reference, userId, flight.id, cabin, total]
    )
    const bookingId = bookingResult.insertId

    for (let i = 0; i < passengers.length; i++) {
      const p = passengers[i]
      const seat = seats[i]
      await conn.query(
        `INSERT INTO booking_passengers (booking_id, first_name, last_name, dob, passport, seat_id) VALUES (?, ?, ?, ?, ?, ?)`,
        [bookingId, p.firstName, p.lastName, p.dob, p.passport, seat.id]
      )
    }

    await conn.query(`INSERT INTO payments (booking_id, method, amount, status) VALUES (?, 'card', ?, 'paid')`, [bookingId, total])
    await conn.query(`UPDATE flights SET seats_left = GREATEST(seats_left - ?, 0) WHERE id = ?`, [passengers.length, flight.id])

    await conn.commit()
    return { reference, total }
  } catch (err) {
    await conn.rollback()
    throw err
  } finally {
    conn.release()
  }
}

const FREE_CANCELLATION_HOURS = 24

export async function cancelBooking(userId, reference) {
  const conn = await pool.getConnection()
  try {
    const [rows] = await conn.query(
      `SELECT b.*, TIMESTAMPDIFF(HOUR, b.created_at, NOW()) AS hoursSinceBooking
       FROM bookings b WHERE b.reference = ? AND b.user_id = ?`,
      [reference, userId]
    )
    const booking = rows[0]
    if (!booking) return { success: false, message: 'Booking not found.' }
    if (booking.status === 'cancelled') return { success: false, message: 'This booking is already cancelled.' }
    if (booking.hoursSinceBooking >= FREE_CANCELLATION_HOURS) {
      return { success: false, message: 'The 24-hour free cancellation window has passed.' }
    }

    await conn.beginTransaction()
    await conn.query(`UPDATE bookings SET status = 'cancelled' WHERE id = ?`, [booking.id])
    const [[{ passengerCount }]] = await conn.query(
      'SELECT COUNT(*) AS passengerCount FROM booking_passengers WHERE booking_id = ?',
      [booking.id]
    )
    await conn.query('UPDATE flights SET seats_left = seats_left + ? WHERE id = ?', [passengerCount, booking.flight_id])
    await conn.query(`UPDATE payments SET status = 'refunded' WHERE booking_id = ?`, [booking.id])
    await conn.commit()

    return { success: true }
  } catch (err) {
    await conn.rollback()
    return { success: false, message: 'Cancellation failed.' }
  } finally {
    conn.release()
  }
}

export async function listMyBookings(userId) {
  const [rows] = await pool.query(
    `SELECT b.reference, b.total, b.status, b.created_at,
            f.flight_no, f.origin_code, f.destination_code, f.depart_time
     FROM bookings b JOIN flights f ON f.id = b.flight_id
     WHERE b.user_id = ? ORDER BY b.created_at DESC LIMIT 10`,
    [userId]
  )
  return rows
}
