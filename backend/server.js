import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { testConnection } from './config/db.js'

import authRoutes from './routes/authRoutes.js'
import flightRoutes from './routes/flightRoutes.js'
import bookingRoutes from './routes/bookingRoutes.js'
import adminRoutes from './routes/adminRoutes.js'

dotenv.config()

const app = express()

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }))
app.use(express.json({ limit: '5mb' }))

app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'flight-booking-backend' }))

app.use('/api/auth', authRoutes)
app.use('/api/flights', flightRoutes)
app.use('/api/bookings', bookingRoutes)
app.use('/api/admin', adminRoutes)

app.use((req, res) => res.status(404).json({ message: 'Route not found' }))

// Centralized error handler
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ message: 'Internal server error' })
})

const PORT = process.env.PORT || 5000

app.listen(PORT, async () => {
  console.log(`🚀 Legendry API running on http://localhost:${PORT}`)
  await testConnection()
})
