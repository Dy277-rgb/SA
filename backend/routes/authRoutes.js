import { Router } from 'express'
import { register, login, me, updateProfile, googleAuth, facebookAuth, telegramAuth } from '../controllers/authController.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

router.post('/register', register)
router.post('/login', login)
router.get('/me', requireAuth, me)
router.put('/profile', requireAuth, updateProfile)

router.post('/google', googleAuth)
router.post('/facebook', facebookAuth)
router.post('/telegram', telegramAuth)

export default router
