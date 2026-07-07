import { Router } from 'express'
import { searchFlights, listAirports, listAirlines } from '../controllers/flightController.js'

const router = Router()

router.get('/search', searchFlights)
router.get('/airports', listAirports)
router.get('/airlines', listAirlines)

export default router
