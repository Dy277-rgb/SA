import { Router } from 'express'
import { createBooking, myBookings } from '../controllers/bookingController.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

router.post('/', requireAuth, createBooking)
router.get('/mine', requireAuth, myBookings)

export default router
