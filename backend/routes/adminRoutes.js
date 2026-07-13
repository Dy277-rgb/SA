import { Router } from 'express'
import {
  allBookings, allFlights, createFlight, deleteFlight, stats,
  listUsers, updateUserRole, deleteUser, adminCancelBooking,
} from '../controllers/adminController.js'
import { requireAuth, requireAdmin } from '../middleware/auth.js'

const router = Router()

router.use(requireAuth, requireAdmin)

router.get('/stats', stats)

router.get('/bookings', allBookings)
router.delete('/bookings/:reference', adminCancelBooking)

router.get('/flights', allFlights)
router.post('/flights', createFlight)
router.delete('/flights/:id', deleteFlight)

router.get('/users', listUsers)
router.patch('/users/:id/role', updateUserRole)
router.delete('/users/:id', deleteUser)

export default router
