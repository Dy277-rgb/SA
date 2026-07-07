import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CheckCircle2, Plane, Download } from 'lucide-react'
import { useBooking } from '../context/BookingContext.jsx'
import Button from '../components/common/Button.jsx'

export default function BookingConfirmation() {
  const navigate = useNavigate()
  const {
    selectedFlight, searchParams, selectedSeats, passengerDetails,
    grandTotal, bookingReference, resetBookingFlow,
  } = useBooking()

  useEffect(() => {
    if (!selectedFlight || !bookingReference) navigate('/search')
  }, [selectedFlight, bookingReference, navigate])

  if (!selectedFlight || !bookingReference) return null

  function handleDone() {
    resetBookingFlow()
    navigate('/dashboard')
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-14 text-center sm:px-6">
      <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
        <CheckCircle2 size={32} className="text-green-600" />
      </span>
      <h1 className="mt-5 font-display text-3xl font-bold text-ink">Booking confirmed!</h1>
      <p className="mt-2 text-sm text-slate">Your e-ticket has been sent to your email. Reference below.</p>

      <div className="ticket-stub shadow-ticket mt-8 p-6 text-left">
        <div className="flex items-center justify-between border-b border-dashed border-slate-light/40 pb-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-light">Booking reference</p>
            <p className="font-mono text-xl font-bold text-sky">{bookingReference}</p>
          </div>
          <Plane size={28} className="-rotate-45 text-sunrise" />
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="text-center">
            <p className="font-display text-2xl font-bold text-ink">{selectedFlight.from}</p>
            <p className="text-xs text-slate">{new Date(selectedFlight.departTime).toLocaleString()}</p>
          </div>
          <div className="flex-1 px-4">
            <div className="flight-path-line h-px w-full" />
            <p className="mt-1 text-center text-xs text-slate-light">{selectedFlight.airline.name} {selectedFlight.flightNo}</p>
          </div>
          <div className="text-center">
            <p className="font-display text-2xl font-bold text-ink">{selectedFlight.to}</p>
            <p className="text-xs text-slate">{new Date(selectedFlight.arriveTime).toLocaleString()}</p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-4 border-t border-dashed border-slate-light/40 pt-4 text-sm">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-light">Passengers</p>
            <p className="text-ink">
              {passengerDetails.map((p) => `${p.firstName} ${p.lastName}`).join(', ')}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-light">Seats</p>
            <p className="text-ink">{selectedSeats.map((s) => s.id).join(', ')}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-light">Cabin</p>
            <p className="capitalize text-ink">{searchParams.cabin}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-light">Total paid</p>
            <p className="font-semibold text-ink">${grandTotal}</p>
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button variant="outline" className="gap-2">
          <Download size={15} /> Download e-ticket
        </Button>
        <Button onClick={handleDone}>Go to my dashboard</Button>
      </div>

      <p className="mt-6 text-sm text-slate">
        Or <Link to="/" className="font-semibold text-sky hover:underline">return to home</Link>
      </p>
    </div>
  )
}
