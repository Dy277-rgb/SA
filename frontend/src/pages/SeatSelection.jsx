import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBooking } from '../context/BookingContext.jsx'
import { seatLayout } from '../data/mockData.js'
import SeatMap from '../components/booking/SeatMap.jsx'
import PassengerForm from '../components/booking/PassengerForm.jsx'
import Button from '../components/common/Button.jsx'

export default function SeatSelection() {
  const navigate = useNavigate()
  const {
    selectedFlight, searchParams, selectedSeats, setSelectedSeats,
    passengerDetails, setPassengerDetails, fareTotal, seatTotal, grandTotal,
  } = useBooking()

  const [error, setError] = useState('')

  useEffect(() => {
    if (!selectedFlight) navigate('/search')
  }, [selectedFlight, navigate])

  useEffect(() => {
    if (passengerDetails.length !== searchParams.passengers) {
      setPassengerDetails(Array.from({ length: searchParams.passengers }, () => ({})))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.passengers])

  function toggleSeat(seat) {
    setSelectedSeats((prev) =>
      prev.some((s) => s.id === seat.id) ? prev.filter((s) => s.id !== seat.id) : [...prev, seat]
    )
  }

  function updatePassenger(index, data) {
    setPassengerDetails((prev) => prev.map((p, i) => (i === index ? data : p)))
  }

  function handleContinue() {
    if (selectedSeats.length !== searchParams.passengers) {
      setError(`Please select exactly ${searchParams.passengers} seat(s).`)
      return
    }
    const incomplete = passengerDetails.some((p) => !p.firstName || !p.lastName || !p.dob || !p.passport)
    if (incomplete) {
      setError('Please complete all passenger details.')
      return
    }
    setError('')
    navigate('/booking/payment')
  }

  if (!selectedFlight) return null

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="mb-1 font-display text-2xl font-bold text-ink">Select your seats</h1>
      <p className="mb-8 text-sm text-slate">
        {selectedFlight.airline.name} {selectedFlight.flightNo} · {selectedFlight.from} → {selectedFlight.to}
      </p>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-light/30 bg-white p-6 lg:col-span-2">
          <SeatMap
            seats={seatLayout}
            selectedSeats={selectedSeats}
            onToggle={toggleSeat}
            maxSeats={searchParams.passengers}
          />
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-light/30 bg-white p-5">
            <h3 className="mb-3 font-display text-sm font-semibold text-ink">Passenger details</h3>
            <div className="space-y-3">
              {passengerDetails.map((p, i) => (
                <PassengerForm key={i} index={i} data={p} onChange={updatePassenger} />
              ))}
            </div>
          </div>

          <div className="ticket-stub shadow-card p-5">
            <h3 className="mb-3 font-display text-sm font-semibold text-ink">Price summary</h3>
            <div className="space-y-2 text-sm text-slate">
              <div className="flex justify-between"><span>Fare ({searchParams.passengers}x)</span><span>${fareTotal}</span></div>
              <div className="flex justify-between"><span>Seat selection</span><span>${seatTotal}</span></div>
              <div className="mt-2 flex justify-between border-t border-dashed border-slate-light/40 pt-2 font-display text-base font-bold text-ink">
                <span>Total</span><span>${grandTotal}</span>
              </div>
            </div>
          </div>

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

          <Button onClick={handleContinue} className="w-full">Continue to payment</Button>
        </div>
      </div>
    </div>
  )
}
