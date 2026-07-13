export const airports = [
  { code: 'JFK', city: 'New York', country: 'USA' },
  { code: 'LHR', city: 'London', country: 'UK' },
  { code: 'DXB', city: 'Dubai', country: 'UAE' },
  { code: 'SIN', city: 'Singapore', country: 'Singapore' },
  { code: 'NRT', city: 'Tokyo', country: 'Japan' },
  { code: 'CDG', city: 'Paris', country: 'France' },
  { code: 'SYD', city: 'Sydney', country: 'Australia' },
  { code: 'BOM', city: 'Mumbai', country: 'India' },
  { code: 'PNH', city: 'Phnom Penh', country: 'Cambodia' },
  { code: 'BKK', city: 'Bangkok', country: 'Thailand' },
]

export const airlines = [
  { id: 'al1', name: 'AeroLuxe Airways', code: 'AL', rating: 4.8, fleet: 'Boeing 787', color: '#2E6FE8' },
  { id: 'al2', name: 'Meridian Air', code: 'MA', rating: 4.6, fleet: 'Airbus A350', color: '#F5A623' },
  { id: 'al3', name: 'Northwind Airlines', code: 'NW', rating: 4.5, fleet: 'Boeing 777', color: '#0B1B33' },
  { id: 'al4', name: 'Zenith Global', code: 'ZG', rating: 4.7, fleet: 'Airbus A380', color: '#1E52B8' },
]

export const mockUsers = [
  { id: 'user-demo-1', name: 'Alex Rivera', email: 'alex@example.com', role: 'user', createdAt: new Date(Date.now() - 30 * 86400000).toISOString() },
  { id: 'user-demo-2', name: 'Priya Nair', email: 'priya@example.com', role: 'user', createdAt: new Date(Date.now() - 12 * 86400000).toISOString() },
  { id: 'admin-1', name: 'Admin User', email: 'admin@skylane.com', role: 'admin', createdAt: new Date(Date.now() - 90 * 86400000).toISOString() },
]

export const popularDestinations = [
  { id: 'd1', city: 'Paris', country: 'France', code: 'CDG', price: 480, image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=800&auto=format&fit=crop' },
  { id: 'd2', city: 'Tokyo', country: 'Japan', code: 'NRT', price: 720, image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=800&auto=format&fit=crop' },
  { id: 'd3', city: 'Dubai', country: 'UAE', code: 'DXB', price: 390, image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?q=80&w=800&auto=format&fit=crop' },
  { id: 'd4', city: 'Bali', country: 'Indonesia', code: 'DPS', price: 540, image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?q=80&w=800&auto=format&fit=crop' },
  { id: 'd5', city: 'Sydney', country: 'Australia', code: 'SYD', price: 810, image: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?q=80&w=800&auto=format&fit=crop' },
  { id: 'd6', city: 'Bangkok', country: 'Thailand', code: 'BKK', price: 350, image: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?q=80&w=800&auto=format&fit=crop' },
]

export const specialOffers = [
  { id: 'o1', title: 'Early Bird Escape', subtitle: 'Book 60 days ahead and save', discount: '25% OFF', route: 'JFK → LHR', validUntil: '2026-08-31', color: 'from-sky to-navy' },
  { id: 'o2', title: 'Weekend Getaway', subtitle: 'Short-haul weekend fares', discount: '15% OFF', route: 'PNH → BKK', validUntil: '2026-07-31', color: 'from-sunrise to-sunrise-dark' },
  { id: 'o3', title: 'Business Upgrade Deal', subtitle: 'Upgrade to business for less', discount: '$200 OFF', route: 'DXB → SIN', validUntil: '2026-09-15', color: 'from-navy to-navy-light' },
]

function addHours(dateStr, hours) {
  const d = new Date(dateStr)
  d.setHours(d.getHours() + hours)
  return d.toISOString()
}

export function generateFlights({ from, to, date }) {
  const baseDate = date || new Date().toISOString().slice(0, 10)
  const templates = [
    { airline: airlines[0], flightNo: 'AL 204', duration: 5, stops: 0, priceEconomy: 320, priceBusiness: 980, departTime: '06:15' },
    { airline: airlines[1], flightNo: 'MA 118', duration: 7.5, stops: 1, priceEconomy: 275, priceBusiness: 890, departTime: '09:40' },
    { airline: airlines[2], flightNo: 'NW 552', duration: 6, stops: 0, priceEconomy: 350, priceBusiness: 1050, departTime: '13:20' },
    { airline: airlines[3], flightNo: 'ZG 077', duration: 8, stops: 1, priceEconomy: 260, priceBusiness: 860, departTime: '18:05' },
    { airline: airlines[0], flightNo: 'AL 981', duration: 5.5, stops: 0, priceEconomy: 340, priceBusiness: 1000, departTime: '21:50' },
  ]
  return templates.map((t, i) => {
    const [h, m] = t.departTime.split(':').map(Number)
    const depart = new Date(`${baseDate}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`)
    const arrive = new Date(depart.getTime() + t.duration * 60 * 60 * 1000)
    return {
      id: `fl-${baseDate}-${i}`,
      airline: t.airline,
      flightNo: t.flightNo,
      from: from || 'JFK',
      to: to || 'LHR',
      departTime: depart.toISOString(),
      arriveTime: arrive.toISOString(),
      duration: t.duration,
      stops: t.stops,
      priceEconomy: t.priceEconomy,
      priceBusiness: t.priceBusiness,
      seatsLeft: 3 + ((i * 7) % 9),
    }
  })
}

export const seatLayout = (() => {
  const rows = 20
  const cols = ['A', 'B', 'C', 'D', 'E', 'F']
  const seats = []
  for (let r = 1; r <= rows; r++) {
    for (const c of cols) {
      const isBusiness = r <= 4
      const isAisle = c === 'C' || c === 'D'
      seats.push({
        id: `${r}${c}`,
        row: r,
        col: c,
        type: isBusiness ? 'business' : 'economy',
        price: isBusiness ? 120 : (r <= 8 ? 35 : 0),
        status: Math.random() < 0.18 ? 'taken' : 'available',
        aisle: isAisle,
      })
    }
  }
  return seats
})()
