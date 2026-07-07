import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import mysql from 'mysql2/promise'
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'

dotenv.config()

const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function run() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
  })

  const schemaPath = path.join(__dirname, '../../database/schema.sql')
  const schema = fs.readFileSync(schemaPath, 'utf8')

  console.log('Running schema.sql ...')
  await connection.query(schema)

  await connection.query(`USE ${process.env.DB_NAME || 'flight_booking'}`)

  const passwordHash = await bcrypt.hash('Admin@123', 10)
  await connection.query(
    `INSERT IGNORE INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'admin')`,
    ['Admin User', 'admin@skylane.com', passwordHash]
  )

  console.log('✅ Database initialized. Admin login: admin@skylane.com / Admin@123')
  await connection.end()
}

run().catch((err) => {
  console.error('❌ DB init failed:', err.message)
  process.exit(1)
})
