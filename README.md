# SkyLane — Flight Booking System

A complete full-stack flight booking application.

- **Frontend:** React 18 + Vite + Tailwind CSS + React Router
- **Backend:** Express.js REST API
- **Database:** MySQL

## Project structure

```
flight-booking-system/
├── frontend/              React + Vite + Tailwind app
│   └── src/
│       ├── api/           Axios client (JWT interceptor)
│       ├── components/    layout, home, flights, booking, common
│       ├── context/       AuthContext, BookingContext
│       ├── data/          Demo/mock data (fallback when API is offline)
│       └── pages/         Home, Login, Register, SearchResults,
│                           SeatSelection, Payment, BookingConfirmation,
│                           dashboard/UserDashboard, dashboard/AdminDashboard
├── backend/                Express API
│   ├── config/db.js        MySQL connection pool
│   ├── controllers/        auth, flights, bookings, admin
│   ├── middleware/auth.js  JWT auth + admin guard
│   ├── routes/              /api/auth, /api/flights, /api/bookings, /api/admin
│   └── utils/initDb.js     Runs schema.sql + seeds an admin user
└── database/schema.sql     MySQL schema + seed data (airlines, airports)
```

## Features

- Responsive navbar, hero, flight search, popular destinations, top airlines, special offers
- Login / Register (JWT-based)
- Flight search results with filters (price, airline, sort)
- Seat selection (interactive seat map) + passenger detail forms
- Payment page (card / PayPal demo flow) with order summary
- Booking confirmation with e-ticket style summary
- User dashboard (my bookings, trip stats)
- Admin dashboard (revenue, bookings, users, flight & airline management)

The frontend works standalone with realistic demo data even without the
backend running, and automatically switches to real API calls once the
backend + MySQL are set up — no code changes required.

## 1. Set up the database

1. Make sure MySQL is installed and running.
2. Copy the backend environment file and fill in your MySQL credentials:

   ```bash
   cd backend
   cp .env.example .env
   # edit .env: DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, JWT_SECRET
   ```

3. Initialize the schema and seed data (creates the database, tables, and a
   default admin account):

   ```bash
   npm install
   npm run db:init
   ```

   Default admin login created: `admin@skylane.com` / `Admin@123`

   You can also run `database/schema.sql` manually with any MySQL client.

## 2. Run the backend

```bash
cd backend
npm install
npm run dev        # nodemon-style auto-reload via `node --watch`
# or: npm start
```

The API runs on `http://localhost:5000` (health check at `/api/health`).

## 3. Run the frontend

```bash
cd frontend
npm install
npm run dev
```

The app runs on `http://localhost:5173`. Vite is configured to proxy
`/api/*` requests to `http://localhost:5000`, so no CORS setup is needed in
development.

## 4. Sample flights for testing search

`schema.sql` seeds airlines and airports only. Insert a few sample flights
so `/api/flights/search` returns results, e.g.:

```sql
USE flight_booking;
INSERT INTO flights (flight_no, airline_id, origin_code, destination_code, depart_time, arrive_time, duration_hours, stops, price_economy, price_business, seats_left)
VALUES
 ('AL204', 1, 'JFK', 'LHR', '2026-08-01 06:15:00', '2026-08-01 11:15:00', 5.0, 0, 320, 980, 42),
 ('MA118', 2, 'JFK', 'LHR', '2026-08-01 09:40:00', '2026-08-01 17:10:00', 7.5, 1, 275, 890, 30);
```

If no flights exist yet (or the backend is offline), the frontend
automatically falls back to generated demo flights so the booking flow can
still be fully tested end-to-end.

## Environment variables (backend/.env)

| Variable | Description |
|---|---|
| `PORT` | API port (default `5000`) |
| `CLIENT_URL` | Frontend origin for CORS (default `http://localhost:5173`) |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | MySQL connection |
| `JWT_SECRET` | Secret used to sign auth tokens — set a long random value |
| `JWT_EXPIRES_IN` | Token lifetime (default `7d`) |

## Notes

- Passwords are hashed with bcrypt; auth uses JWT bearer tokens.
- Admin-only routes (`/api/admin/*`) are protected by role-based middleware.
- The demo login in the UI treats any email starting with `admin` as an
  admin when the backend is unreachable, purely so the admin dashboard can
  be previewed without a live database.
