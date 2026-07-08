import { Plane, Facebook, Twitter, Instagram, Linkedin, Youtube } from 'lucide-react'

// Edit these URLs to point to your real social profiles.
// Remove or add entries as needed — the icon list below renders automatically.
const socialLinks = [
  { name: 'Facebook', href: 'https://www.facebook.com/share/1J18owDVkp/?mibextid=wwXIfr', icon: Facebook },
  { name: 'Twitter', href: 'https://twitter.com/yourhandle', icon: Twitter },
  { name: 'Instagram', href: 'https://www.instagram.com/thann_dy?igsh=cHQwZTVnM2k4MnFr&utm_source=qr', icon: Instagram },
  { name: 'LinkedIn', href: 'https://linkedin.com/company/yourcompany', icon: Linkedin },
  { name: 'YouTube', href: 'https://www.youtube.com/@thandy1071', icon: Youtube },
]

export default function Footer() {
  return (
    <footer className="bg-navy text-white/70">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-4 lg:px-8">
        <div>
          <div className="flex items-center gap-2 font-display text-lg font-bold text-white">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black">
              <img src="/LOgo.png" alt="SkyLane logo" className="h-9 w-9 rounded-full object-cover" />
            </span>
            SkyLane
          </div>
          <p className="mt-3 text-sm">Search, compare, and book flights to over 500 destinations worldwide.</p>
          <div className="mt-4 flex gap-3">
            {socialLinks.map(({ name, href, icon: Icon }) => (
              <a
                key={name}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={name}
                className="text-white/70 transition hover:text-white"
              >
                <Icon size={18} />
              </a>
            ))}
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
        © {new Date().getFullYear()} SkyLane. All rights reserved.
      </div>
    </footer>
  )
}
