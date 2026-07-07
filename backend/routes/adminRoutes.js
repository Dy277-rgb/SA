import { Router } from 'express'
import { allBookings, allFlights, createFlight, deleteFlight, stats } from '../controllers/adminController.js'
import { requireAuth, requireAdmin } from '../middleware/auth.js'

const router = Router()

router.use(requireAuth, requireAdmin)

router.get('/stats', stats)
router.get('/bookings', allBookings)
router.get('/flights', allFlights)
router.post('/flights', createFlight)
router.delete('/flights/:id', deleteFlight)

export default router
