import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CreditCard, Lock, ShieldCheck } from 'lucide-react'
import { useBooking } from '../context/BookingContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import Button from '../components/common/Button.jsx'
import api from '../api/axios.js'

function generateRef() {
  return 'SL' + Math.random().toString(36).slice(2, 8).toUpperCase()
}

export default function Payment() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const {
    selectedFlight, searchParams, selectedSeats, passengerDetails,
    grandTotal, setBookingReference, resetBookingFlow,
  } = useBooking()

  const [method, setMethod] = useState('card')
  const [card, setCard] = useState({ number: '', name: '', expiry: '', cvv: '' })
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!selectedFlight) navigate('/search')
  }, [selectedFlight, navigate])

  async function handlePay(e) {
    e.preventDefault()
    setError('')
    if (method === 'card') {
      if (card.number.replace(/\s/g, '').length < 16 || !card.name || !card.expiry || card.cvv.length < 3) {
        setError('Please fill in valid card details.')
        return
      }
    }
    setProcessing(true)
    const reference = generateRef()
    try {
      await api.post('/bookings', {
        userId: user?.id,
        flight: selectedFlight,
        searchParams,
        seats: selectedSeats,
        passengers: passengerDetails,
        total: grandTotal,
        reference,
      })
    } catch {
      // Demo fallback: persist locally so the dashboard has something to show
      const existing = JSON.parse(localStorage.getItem('skylane_bookings') || '[]')
      existing.push({
        reference, flight: selectedFlight, searchParams, seats: selectedSeats,
        passengers: passengerDetails, total: grandTotal, status: 'confirmed',
        createdAt: new Date().toISOString(), userId: user?.id,
      })
      localStorage.setItem('skylane_bookings', JSON.stringify(existing))
    }
    setTimeout(() => {
      setBookingReference(reference)
      setProcessing(false)
      navigate('/booking/confirmation')
    }, 900)
  }

  if (!selectedFlight) return null

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="mb-1 font-display text-2xl font-bold text-ink">Payment</h1>
      <p className="mb-8 text-sm text-slate">Secure checkout · {selectedFlight.from} → {selectedFlight.to}</p>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <form onSubmit={handlePay} className="space-y-5 rounded-2xl border border-slate-light/30 bg-white p-6 lg:col-span-2">
          <div className="flex gap-2">
            {['card', 'paypal'].map((m) => (
              <button
                type="button"
                key={m}
                onClick={() => setMethod(m)}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold capitalize transition ${
                  method === m ? 'bg-sky text-white' : 'bg-mist text-slate hover:bg-sky-light'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          {method === 'card' ? (
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate">Card number</label>
                <div className="flex items-center gap-2 rounded-lg border border-slate-light/40 px-3 py-2.5 focus-within:border-sky">
                  <CreditCard size={16} className="text-slate-light" />
                  <input
                    value={card.number}
                    onChange={(e) => setCard({ ...card, number: e.target.value })}
                    placeholder="4242 4242 4242 4242"
                    maxLength={19}
                    className="w-full text-sm outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate">Cardholder name</label>
                <input
                  value={card.name}
                  onChange={(e) => setCard({ ...card, name: e.target.value })}
                  placeholder="Jane Doe"
                  className="w-full rounded-lg border border-slate-light/40 px-3 py-2.5 text-sm outline-none focus:border-sky"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate">Expiry</label>
                  <input
                    value={card.expiry}
                    onChange={(e) => setCard({ ...card, expiry: e.target.value })}
                    placeholder="MM/YY"
                    maxLength={5}
                    className="w-full rounded-lg border border-slate-light/40 px-3 py-2.5 text-sm outline-none focus:border-sky"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate">CVV</label>
                  <input
                    value={card.cvv}
                    onChange={(e) => setCard({ ...card, cvv: e.target.value })}
                    placeholder="123"
                    maxLength={4}
                    className="w-full rounded-lg border border-slate-light/40 px-3 py-2.5 text-sm outline-none focus:border-sky"
                  />
                </div>
              </div>
            </div>
          ) : (
            <p className="rounded-lg bg-mist p-4 text-sm text-slate">You'll be redirected to PayPal to complete payment (demo).</p>
          )}

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

          <div className="flex items-center gap-2 text-xs text-slate-light">
            <Lock size={13} /> Your payment details are encrypted and never stored.
          </div>

          <Button type="submit" disabled={processing} className="w-full">
            {processing ? 'Processing payment...' : `Pay $${grandTotal}`}
          </Button>
        </form>

        <div className="ticket-stub shadow-card h-fit space-y-4 p-5">
          <h3 className="font-display text-sm font-semibold text-ink">Order summary</h3>
          <div className="text-sm text-slate">
            <p className="font-semibold text-ink">{selectedFlight.airline.name} {selectedFlight.flightNo}</p>
            <p>{selectedFlight.from} → {selectedFlight.to}</p>
            <p>{new Date(selectedFlight.departTime).toLocaleString()}</p>
          </div>
          <div className="border-t border-dashed border-slate-light/40 pt-3 text-sm text-slate">
            <p>{searchParams.passengers} passenger(s) · {selectedSeats.map((s) => s.id).join(', ')}</p>
          </div>
          <div className="flex items-center justify-between border-t border-dashed border-slate-light/40 pt-3 font-display text-lg font-bold text-ink">
            <span>Total</span><span>${grandTotal}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-light">
            <ShieldCheck size={14} className="text-sky" /> Free cancellation within 24 hours
          </div>
        </div>
      </div>
    </div>
  )
}
