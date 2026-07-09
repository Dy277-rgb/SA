import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import pool from '../config/db.js'

function signToken(user) {
  return jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  )
}

export async function register(req, res) {
  const { name, email, password } = req.body
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email and password are required' })
  }

  try {
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email])
    if (existing.length) {
      return res.status(409).json({ message: 'Email is already registered' })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [name, email, passwordHash, 'user']
    )

    const user = { id: result.insertId, name, email, role: 'user' }
    const token = signToken(user)
    res.status(201).json({ user, token })
  } catch (err) {
    res.status(500).json({ message: 'Registration failed', error: err.message })
  }
}

export async function login(req, res) {
  const { email, password } = req.body
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' })
  }

  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email])
    const record = rows[0]
    if (!record) return res.status(401).json({ message: 'Invalid credentials' })

    const match = await bcrypt.compare(password, record.password_hash)
    if (!match) return res.status(401).json({ message: 'Invalid credentials' })

    const user = { id: record.id, name: record.name, email: record.email, role: record.role, avatar: record.avatar || null }
    const token = signToken(user)
    res.json({ user, token })
  } catch (err) {
    res.status(500).json({ message: 'Login failed', error: err.message })
  }
}

export async function me(req, res) {
  try {
    const [rows] = await pool.query('SELECT id, name, email, role, avatar FROM users WHERE id = ?', [req.user.id])
    if (!rows[0]) return res.status(404).json({ message: 'User not found' })
    res.json({ user: rows[0] })
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch profile', error: err.message })
  }
}

export async function updateProfile(req, res) {
  const { name, email, currentPassword, newPassword, avatar } = req.body
  const userId = req.user.id

  if (!name || !email) {
    return res.status(400).json({ message: 'Name and email are required' })
  }

  // avatar is a base64 data URL (e.g. "data:image/jpeg;base64,...").
  // Reject anything absurdly large — the frontend already compresses images
  // before sending, so a legitimate upload should be well under this.
  if (avatar && (typeof avatar !== 'string' || !avatar.startsWith('data:image/') || avatar.length > 4_000_000)) {
    return res.status(400).json({ message: 'Invalid or oversized image' })
  }

  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [userId])
    const record = rows[0]
    if (!record) return res.status(404).json({ message: 'User not found' })

    if (email !== record.email) {
      const [existing] = await pool.query('SELECT id FROM users WHERE email = ? AND id != ?', [email, userId])
      if (existing.length) return res.status(409).json({ message: 'That email is already in use' })
    }

    let passwordHash = record.password_hash
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ message: 'Enter your current password to set a new one' })
      }
      const match = await bcrypt.compare(currentPassword, record.password_hash)
      if (!match) return res.status(401).json({ message: 'Current password is incorrect' })
      if (newPassword.length < 6) {
        return res.status(400).json({ message: 'New password must be at least 6 characters' })
      }
      passwordHash = await bcrypt.hash(newPassword, 10)
    }

    // avatar === null means "remove photo"; undefined means "leave unchanged"
    const nextAvatar = avatar === undefined ? record.avatar : avatar

    await pool.query('UPDATE users SET name = ?, email = ?, password_hash = ?, avatar = ? WHERE id = ?', [
      name, email, passwordHash, nextAvatar, userId,
    ])

    const updatedUser = { id: userId, name, email, role: record.role, avatar: nextAvatar }
    const token = signToken(updatedUser)
    res.json({ user: updatedUser, token })
  } catch (err) {
    res.status(500).json({ message: 'Failed to update profile', error: err.message })
  }
}
