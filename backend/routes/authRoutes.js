import { Router } from 'express'
import { register, login, me, updateProfile, googleAuth } from '../controllers/authController.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

router.post('/register', register)
router.post('/login', login)
router.get('/me', requireAuth, me)
router.put('/profile', requireAuth, updateProfile)

router.post('/google', googleAuth)

export default router
