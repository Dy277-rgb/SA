import { createContext, useContext, useState } from 'react'

const BookingContext = createContext(null)

export function BookingProvider({ children }) {
  const [searchParams, setSearchParams] = useState({
    from: 'JFK',
    to: 'LHR',
    departDate: new Date().toISOString().slice(0, 10),
    returnDate: '',
    passengers: 1,
    tripType: 'oneway',
    cabin: 'economy',
  })
  const [selectedFlight, setSelectedFlight] = useState(null)
  const [selectedSeats, setSelectedSeats] = useState([])
  const [passengerDetails, setPassengerDetails] = useState([])
  const [bookingReference, setBookingReference] = useState(null)

  function resetBookingFlow() {
    setSelectedFlight(null)
    setSelectedSeats([])
    setPassengerDetails([])
    setBookingReference(null)
  }

  const seatTotal = selectedSeats.reduce((sum, s) => sum + s.price, 0)
  const fareTotal = selectedFlight
    ? (searchParams.cabin === 'business' ? selectedFlight.priceBusiness : selectedFlight.priceEconomy) * searchParams.passengers
    : 0
  const grandTotal = fareTotal + seatTotal

  return (
    <BookingContext.Provider
      value={{
        searchParams, setSearchParams,
        selectedFlight, setSelectedFlight,
        selectedSeats, setSelectedSeats,
        passengerDetails, setPassengerDetails,
        bookingReference, setBookingReference,
        resetBookingFlow,
        fareTotal, seatTotal, grandTotal,
      }}
    >
      {children}
    </BookingContext.Provider>
  )
}

export function useBooking() {
  const ctx = useContext(BookingContext)
  if (!ctx) throw new Error('useBooking must be used within BookingProvider')
  return ctx
}
