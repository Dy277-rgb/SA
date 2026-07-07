import Hero from '../components/home/Hero.jsx'
import FlightSearchForm from '../components/home/FlightSearchForm.jsx'
import PopularDestinations from '../components/home/PopularDestinations.jsx'
import TopAirlines from '../components/home/TopAirlines.jsx'
import SpecialOffers from '../components/home/SpecialOffers.jsx'

export default function Home() {
  return (
    <div>
      <Hero />
      <FlightSearchForm />
      <PopularDestinations />
      <TopAirlines />
      <SpecialOffers />
    </div>
  )
}
