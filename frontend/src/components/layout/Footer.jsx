import { Plane, Facebook, Twitter, Instagram } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-navy text-white/70">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-4 lg:px-8">
        <div>
          <div className="flex items-center gap-2 font-display text-lg font-bold text-white">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black">
              <img src="/LOgo.png" alt="SkyLane logo" className="h-9 w-9 rounded-full object-cover" />
            </span>
             Legendry Air Line
          </div>
          <p className="mt-3 text-sm">Search, compare, and book flights to over 500 destinations worldwide.</p>
          <div className="mt-4 flex gap-3">
            <Facebook size={18} className="cursor-pointer hover:text-white" />
            <Twitter size={18} className="cursor-pointer hover:text-white" />
            <Instagram size={18} className="cursor-pointer hover:text-white" />
          </div>
        </div>
        <div>
          <h4 className="font-display text-sm font-semibold text-white">Company</h4>
          <ul className="mt-3 space-y-2 text-sm">
            <li>About us</li>
            <li>Careers</li>
            <li>Press</li>
          </ul>
        </div>
        <div>
          <h4 className="font-display text-sm font-semibold text-white">Support</h4>
          <ul className="mt-3 space-y-2 text-sm">
            <li>Help center</li>
            <li>Manage booking</li>
            <li>Refund policy</li>
          </ul>
        </div>
        <div>
          <h4 className="font-display text-sm font-semibold text-white">Legal</h4>
          <ul className="mt-3 space-y-2 text-sm">
            <li>Terms of service</li>
            <li>Privacy policy</li>
            <li>Cookie policy</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-white/50">
        © {new Date().getFullYear()} Legendry Air Line. All rights reserved.
      </div>
    </footer>
  )
}
