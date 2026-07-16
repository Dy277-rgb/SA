import dotenv from 'dotenv'
import { Telegraf, Markup } from 'telegraf'
import pool from '../config/db.js'
import { getSession, resetSession, setStep, updateData } from './session.js'
import { searchFlights, listAirports } from './services/flights.js'
import { generateSeatLayout } from './services/seats.js'
import {
  getOrCreateTelegramUser, linkTelegramToAccount, createBooking, cancelBooking, listMyBookings,
} from './services/booking.js'
import { flightSummary, formatDate } from './utils/format.js'

dotenv.config()

if (!process.env.TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN === 'your_bot_token_here') {
  console.error('❌ TELEGRAM_BOT_TOKEN is not set in backend/.env — get one from @BotFather on Telegram.')
  process.exit(1)
}

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN)
const SEAT_ROWS_PER_PAGE = 4
const TOTAL_SEAT_ROWS = 20

// ---------- helpers ----------

const mainMenu = Markup.inlineKeyboard([
  [Markup.button.callback('🔍 Search flights', 'menu_search')],
  [Markup.button.callback('📄 My bookings', 'menu_mybookings')],
  [Markup.button.callback('🔗 Link web account', 'menu_link')],
  [Markup.button.callback('❓ Help', 'menu_help')],
])

async function sendMainMenu(ctx, text = 'What would you like to do?') {
  await ctx.reply(text, mainMenu)
}

function airportButtons(airports, prefix, exclude) {
  const rows = []
  const list = airports.filter((a) => a.code !== exclude)
  for (let i = 0; i < list.length; i += 2) {
    const row = list.slice(i, i + 2).map((a) => Markup.button.callback(`${a.city} (${a.code})`, `${prefix}:${a.code}`))
    rows.push(row)
  }
  return Markup.inlineKeyboard(rows)
}

function dateButtons() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('Today', 'date:0'), Markup.button.callback('Tomorrow', 'date:1'), Markup.button.callback('+3 days', 'date:3')],
    [Markup.button.callback('📅 Type a date', 'date:custom')],
  ])
}

function dateFromOffset(daysOffset) {
  const d = new Date()
  d.setDate(d.getDate() + daysOffset)
  return d.toISOString().slice(0, 10)
}

function seatPageText(seatLayout, page, selected, passengers) {
  const startRow = page * SEAT_ROWS_PER_PAGE + 1
  const endRow = Math.min(startRow + SEAT_ROWS_PER_PAGE - 1, TOTAL_SEAT_ROWS)
  const selectedList = selected.length ? selected.map((s) => s.id).join(', ') : 'none yet'
  return (
    `Select ${passengers} seat(s).\n` +
    `Business rows 1-4 (+$120) · Economy rows 5-8 (+$35) · 9-20 free\n\n` +
    `Selected: ${selectedList}\n` +
    `Showing rows ${startRow}-${endRow} (page ${page + 1}/${Math.ceil(TOTAL_SEAT_ROWS / SEAT_ROWS_PER_PAGE)})`
  )
}

function seatKeyboard(seatLayout, page, selected) {
  const startRow = page * SEAT_ROWS_PER_PAGE + 1
  const endRow = Math.min(startRow + SEAT_ROWS_PER_PAGE - 1, TOTAL_SEAT_ROWS)
  const rows = []

  for (let r = startRow; r <= endRow; r++) {
    const rowSeats = seatLayout.filter((s) => s.row === r)
    const buttonRow = rowSeats.map((seat) => {
      const isSelected = selected.some((s) => s.id === seat.id)
      let label = seat.col
      if (seat.status === 'taken') label = '✗'
      else if (isSelected) label = `✅${seat.col}`
      return Markup.button.callback(label, `seat:${seat.id}`)
    })
    rows.push(buttonRow)
  }

  const navRow = []
  if (page > 0) navRow.push(Markup.button.callback('◀ Prev', 'seatpage:prev'))
  if (endRow < TOTAL_SEAT_ROWS) navRow.push(Markup.button.callback('Next ▶', 'seatpage:next'))
  if (navRow.length) rows.push(navRow)

  rows.push([Markup.button.callback('✅ Confirm seats', 'seats:confirm')])
  return Markup.inlineKeyboard(rows)
}

async function renderSeatPage(ctx) {
  const session = getSession(ctx.chat.id)
  const { seatLayout, seatPage = 0, selectedSeats = [] } = session.data
  const text = seatPageText(seatLayout, seatPage, selectedSeats, session.data.passengers)
  const keyboard = seatKeyboard(seatLayout, seatPage, selectedSeats)
  try {
    await ctx.editMessageText(text, keyboard)
  } catch {
    await ctx.reply(text, keyboard)
  }
}

function askPassengerField(ctx, index, field) {
  const prompts = {
    firstName: `Passenger ${index + 1} — first name?`,
    lastName: `Passenger ${index + 1} — last name?`,
    dob: `Passenger ${index + 1} — date of birth? (YYYY-MM-DD)`,
    passport: `Passenger ${index + 1} — passport number?`,
  }
  return ctx.reply(prompts[field])
}

const PASSENGER_FIELD_ORDER = ['firstName', 'lastName', 'dob', 'passport']

// ---------- commands ----------

bot.start(async (ctx) => {
  resetSession(ctx.chat.id)
  const user = await getOrCreateTelegramUser(ctx)
  await ctx.reply(
    `Welcome to Legendry Air Line, ${user.name.split(' ')[0]}! ✈️\n` +
    `Search flights, pick your seat, and book — all right here in Telegram.`
  )
  await sendMainMenu(ctx)
})

bot.help((ctx) =>
  ctx.reply(
    'Legendry bot commands:\n\n' +
    '/start — main menu\n' +
    '/search — search and book a flight\n' +
    '/mybookings — view your bookings and cancel within 24h\n' +
    '/link — connect this Telegram account to your SkyLane website login\n' +
    '/cancelflow — abandon whatever you\'re currently doing'
  )
)

bot.command('cancelflow', (ctx) => {
  resetSession(ctx.chat.id)
  ctx.reply('Cancelled. Use /start to see the menu again.')
})

bot.command('search', (ctx) => startSearch(ctx))
bot.action('menu_search', async (ctx) => { await ctx.answerCbQuery(); startSearch(ctx) })

bot.command('mybookings', (ctx) => showMyBookings(ctx))
bot.action('menu_mybookings', async (ctx) => { await ctx.answerCbQuery(); showMyBookings(ctx) })

bot.action('menu_help', async (ctx) => {
  await ctx.answerCbQuery()
  ctx.reply(
    'Legendry bot commands:\n\n' +
    '/start — main menu\n' +
    '/search — search and book a flight\n' +
    '/mybookings — view your bookings and cancel within 24h\n' +
    '/link — connect this Telegram account to your SkyLane website login'
  )
})

bot.action('menu_link', async (ctx) => {
  await ctx.answerCbQuery()
  setStep(ctx.chat.id, 'awaiting_link_email')
  ctx.reply(
    'Send the email of your existing SkyLane website account.\n\n' +
    "⚠️ Heads up: Telegram doesn't let bots delete messages you send, so your password will remain visible in this chat's history after linking. Only do this if you're comfortable with that, on a device you trust."
  )
})

bot.command('link', (ctx) => {
  setStep(ctx.chat.id, 'awaiting_link_email')
  ctx.reply('Send the email of your existing Legendry website account.')
})

// ---------- search flow ----------

async function startSearch(ctx) {
  resetSession(ctx.chat.id)
  const airports = await listAirports()
  updateData(ctx.chat.id, { airports })
  setStep(ctx.chat.id, 'awaiting_from')
  await ctx.reply('Where are you flying from?', airportButtons(airports, 'from'))
}

bot.action(/^from:(.+)$/, async (ctx) => {
  await ctx.answerCbQuery()
  const from = ctx.match[1]
  updateData(ctx.chat.id, { from })
  setStep(ctx.chat.id, 'awaiting_to')
  const { airports } = getSession(ctx.chat.id).data
  await ctx.reply(`From ${from}. Where to?`, airportButtons(airports, 'to', from))
})

bot.action(/^to:(.+)$/, async (ctx) => {
  await ctx.answerCbQuery()
  const to = ctx.match[1]
  updateData(ctx.chat.id, { to })
  setStep(ctx.chat.id, 'awaiting_date')
  await ctx.reply('When do you want to depart?', dateButtons())
})

bot.action(/^date:(0|1|3)$/, async (ctx) => {
  await ctx.answerCbQuery()
  const date = dateFromOffset(Number(ctx.match[1]))
  updateData(ctx.chat.id, { date })
  setStep(ctx.chat.id, 'awaiting_cabin')
  await ctx.reply(
    `Departing ${formatDate(date)}. Which cabin?`,
    Markup.inlineKeyboard([
      [Markup.button.callback('Economy', 'cabin:economy'), Markup.button.callback('Business', 'cabin:business')],
    ])
  )
})

bot.action('date:custom', async (ctx) => {
  await ctx.answerCbQuery()
  setStep(ctx.chat.id, 'awaiting_date_custom')
  ctx.reply('Type the date as YYYY-MM-DD (e.g. 2026-08-15):')
})

bot.action(/^cabin:(economy|business)$/, async (ctx) => {
  await ctx.answerCbQuery()
  updateData(ctx.chat.id, { cabin: ctx.match[1] })
  setStep(ctx.chat.id, 'awaiting_passengers')
  await ctx.reply(
    'How many passengers?',
    Markup.inlineKeyboard([[1, 2, 3, 4].map((n) => Markup.button.callback(String(n), `pax:${n}`))])
  )
})

bot.action(/^pax:(\d)$/, async (ctx) => {
  await ctx.answerCbQuery()
  const passengers = Number(ctx.match[1])
  updateData(ctx.chat.id, { passengers })
  await runFlightSearch(ctx)
})

async function runFlightSearch(ctx) {
  const { from, to, date } = getSession(ctx.chat.id).data
  await ctx.reply('Searching flights...')
  const flights = await searchFlights(from, to, date)
  updateData(ctx.chat.id, { flights })
  setStep(ctx.chat.id, 'awaiting_flight_choice')

  if (flights.length === 0) {
    await ctx.reply('No flights found for that route. Try /search again with different airports.')
    return
  }

  const { cabin } = getSession(ctx.chat.id).data
  for (const flight of flights) {
    const price = cabin === 'business' ? flight.priceBusiness : flight.priceEconomy
    await ctx.reply(
      `${flightSummary(flight)}\n💰 $${price} · ${flight.seatsLeft} seats left`,
      Markup.inlineKeyboard([[Markup.button.callback('Select this flight', `flight:${flight.id}`)]])
    )
  }
}

bot.action(/^flight:(\d+)$/, async (ctx) => {
  await ctx.answerCbQuery()
  const flightId = Number(ctx.match[1])
  const { flights } = getSession(ctx.chat.id).data
  const flight = flights.find((f) => f.id === flightId)
  if (!flight) return ctx.reply('That flight is no longer available. Please /search again.')

  updateData(ctx.chat.id, {
    flight,
    seatLayout: generateSeatLayout(),
    seatPage: 0,
    selectedSeats: [],
  })
  setStep(ctx.chat.id, 'awaiting_seats')

  const session = getSession(ctx.chat.id)
  await ctx.reply(
    seatPageText(session.data.seatLayout, 0, [], session.data.passengers),
    seatKeyboard(session.data.seatLayout, 0, [])
  )
})

// ---------- seat selection ----------

bot.action(/^seat:(.+)$/, async (ctx) => {
  const seatId = ctx.match[1]
  const session = getSession(ctx.chat.id)
  const { seatLayout, passengers } = session.data
  const seat = seatLayout.find((s) => s.id === seatId)

  if (!seat || seat.status === 'taken') {
    await ctx.answerCbQuery('That seat is taken.', { show_alert: false })
    return
  }

  let selected = session.data.selectedSeats || []
  const alreadySelected = selected.some((s) => s.id === seatId)

  if (alreadySelected) {
    selected = selected.filter((s) => s.id !== seatId)
  } else {
    if (selected.length >= passengers) {
      await ctx.answerCbQuery(`You only need ${passengers} seat(s).`, { show_alert: false })
      return
    }
    selected = [...selected, seat]
  }

  updateData(ctx.chat.id, { selectedSeats: selected })
  await ctx.answerCbQuery()
  await renderSeatPage(ctx)
})

bot.action('seatpage:next', async (ctx) => {
  await ctx.answerCbQuery()
  const session = getSession(ctx.chat.id)
  updateData(ctx.chat.id, { seatPage: (session.data.seatPage || 0) + 1 })
  await renderSeatPage(ctx)
})

bot.action('seatpage:prev', async (ctx) => {
  await ctx.answerCbQuery()
  const session = getSession(ctx.chat.id)
  updateData(ctx.chat.id, { seatPage: Math.max(0, (session.data.seatPage || 0) - 1) })
  await renderSeatPage(ctx)
})

bot.action('seats:confirm', async (ctx) => {
  const session = getSession(ctx.chat.id)
  const { selectedSeats = [], passengers } = session.data

  if (selectedSeats.length !== passengers) {
    await ctx.answerCbQuery(`Please select exactly ${passengers} seat(s).`, { show_alert: true })
    return
  }

  await ctx.answerCbQuery()
  updateData(ctx.chat.id, { passengerIndex: 0, passengerFieldIndex: 0, passengerDetails: [] })
  setStep(ctx.chat.id, 'awaiting_passenger_field')
  await askPassengerField(ctx, 0, 'firstName')
})

// ---------- text input router ----------

bot.on('text', async (ctx) => {
  const session = getSession(ctx.chat.id)
  const text = ctx.message.text.trim()

  if (session.step === 'awaiting_date_custom') {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
      return ctx.reply('Please use the format YYYY-MM-DD, e.g. 2026-08-15.')
    }
    updateData(ctx.chat.id, { date: text })
    setStep(ctx.chat.id, 'awaiting_cabin')
    return ctx.reply(
      `Departing ${formatDate(text)}. Which cabin?`,
      Markup.inlineKeyboard([[Markup.button.callback('Economy', 'cabin:economy'), Markup.button.callback('Business', 'cabin:business')]])
    )
  }

  if (session.step === 'awaiting_passenger_field') {
    return handlePassengerField(ctx, text)
  }

  if (session.step === 'awaiting_link_email') {
    updateData(ctx.chat.id, { linkEmail: text })
    setStep(ctx.chat.id, 'awaiting_link_password')
    return ctx.reply('Now send your SkyLane account password:')
  }

  if (session.step === 'awaiting_link_password') {
    const { linkEmail } = session.data
    const result = await linkTelegramToAccount(ctx.chat.id, linkEmail, text)
    resetSession(ctx.chat.id)
    if (result.success) {
      return ctx.reply(`✅ Linked! Bookings you make here will now also appear in your web dashboard for ${linkEmail}.`)
    }
    return ctx.reply(`❌ ${result.message}`)
  }

  // Not in a known text-input step — just show the menu
  await sendMainMenu(ctx, "I didn't quite catch that. Here's the menu:")
})

async function handlePassengerField(ctx, text) {
  const session = getSession(ctx.chat.id)
  const { passengerIndex, passengerFieldIndex, passengers } = session.data
  const field = PASSENGER_FIELD_ORDER[passengerFieldIndex]

  if (field === 'dob' && !/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return ctx.reply('Please use the format YYYY-MM-DD, e.g. 1990-05-20.')
  }

  const passengerDetails = [...session.data.passengerDetails]
  passengerDetails[passengerIndex] = { ...(passengerDetails[passengerIndex] || {}), [field]: text }
  updateData(ctx.chat.id, { passengerDetails })

  const nextFieldIndex = passengerFieldIndex + 1
  if (nextFieldIndex < PASSENGER_FIELD_ORDER.length) {
    updateData(ctx.chat.id, { passengerFieldIndex: nextFieldIndex })
    return askPassengerField(ctx, passengerIndex, PASSENGER_FIELD_ORDER[nextFieldIndex])
  }

  const nextPassengerIndex = passengerIndex + 1
  if (nextPassengerIndex < passengers) {
    updateData(ctx.chat.id, { passengerIndex: nextPassengerIndex, passengerFieldIndex: 0 })
    return askPassengerField(ctx, nextPassengerIndex, PASSENGER_FIELD_ORDER[0])
  }

  await showPaymentSummary(ctx)
}

// ---------- payment ----------

async function showPaymentSummary(ctx) {
  const session = getSession(ctx.chat.id)
  const { flight, cabin, passengers, selectedSeats } = session.data
  const fareTotal = (cabin === 'business' ? flight.priceBusiness : flight.priceEconomy) * passengers
  const seatTotal = selectedSeats.reduce((sum, s) => sum + s.price, 0)
  const total = fareTotal + seatTotal

  setStep(ctx.chat.id, 'awaiting_payment')
  await ctx.reply(
    `Order summary\n\n` +
    `${flightSummary(flight)}\n` +
    `Seats: ${selectedSeats.map((s) => s.id).join(', ')}\n` +
    `Passengers: ${passengers}\n\n` +
    `Fare: $${fareTotal}\nSeats: $${seatTotal}\nTotal: $${total}`,
    Markup.inlineKeyboard([
      [Markup.button.callback('💳 Confirm payment', 'pay:confirm')],
      [Markup.button.callback('❌ Cancel', 'pay:cancel')],
    ])
  )
}

bot.action('pay:cancel', async (ctx) => {
  await ctx.answerCbQuery()
  resetSession(ctx.chat.id)
  ctx.reply('Booking cancelled. Use /start to begin again.')
})

bot.action('pay:confirm', async (ctx) => {
  await ctx.answerCbQuery('Processing payment...')
  const session = getSession(ctx.chat.id)
  const { flight, cabin, selectedSeats, passengerDetails } = session.data

  try {
    const user = await getOrCreateTelegramUser(ctx)
    const { reference, total } = await createBooking({
      userId: user.id, flight, cabin, seats: selectedSeats, passengers: passengerDetails,
    })

    resetSession(ctx.chat.id)
    await ctx.reply(
      `✅ Booking confirmed!\n\n` +
      `Reference: ${reference}\n` +
      `${flightSummary(flight)}\n` +
      `Seats: ${selectedSeats.map((s) => s.id).join(', ')}\n` +
      `Total paid: $${total}\n\n` +
      `Free cancellation available for 24 hours — use /mybookings.`
    )
    await sendMainMenu(ctx)
  } catch (err) {
    console.error('Booking failed:', err)
    await ctx.reply('Something went wrong creating your booking. Please try again with /search.')
  }
})

// ---------- my bookings ----------

async function showMyBookings(ctx) {
  const user = await getOrCreateTelegramUser(ctx)
  const bookings = await listMyBookings(user.id)

  if (bookings.length === 0) {
    await ctx.reply("You don't have any bookings yet. Use /search to book your first flight!")
    return
  }

  for (const b of bookings) {
    const hoursSince = (Date.now() - new Date(b.created_at).getTime()) / (1000 * 60 * 60)
    const canCancel = b.status === 'confirmed' && hoursSince < 24
    const buttons = canCancel ? [[Markup.button.callback('❌ Cancel this booking', `cancel:${b.reference}`)]] : []

    await ctx.reply(
      `Ref: ${b.reference} — ${b.status.toUpperCase()}\n` +
      `${b.origin_code} → ${b.destination_code} · ${formatDate(b.depart_time)}\n` +
      `Total: $${b.total}`,
      buttons.length ? Markup.inlineKeyboard(buttons) : undefined
    )
  }
}

bot.action(/^cancel:(.+)$/, async (ctx) => {
  await ctx.answerCbQuery()
  const reference = ctx.match[1]
  const user = await getOrCreateTelegramUser(ctx)
  const result = await cancelBooking(user.id, reference)

  if (result.success) {
    await ctx.reply(`Booking ${reference} cancelled and refunded.`)
  } else {
    await ctx.reply(`Couldn't cancel: ${result.message}`)
  }
})

// ---------- lifecycle ----------

bot.catch((err, ctx) => {
  console.error(`Bot error for ${ctx.updateType}:`, err)
  ctx.reply('Something went wrong. Use /start to reset.').catch(() => {})
})

async function start() {
  const conn = await pool.getConnection()
  console.log('✅ MySQL connected (bot)')
  conn.release()

  await bot.launch()
  console.log('🤖 SkyLane Telegram bot is running')
}

start().catch((err) => {
  console.error('❌ Failed to start bot:', err.message)
  process.exit(1)
})

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
