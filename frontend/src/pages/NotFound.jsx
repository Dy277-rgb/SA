import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <Compass size={40} className="text-sky" />
      <h1 className="mt-4 font-display text-3xl font-bold text-ink">Off course</h1>
      <p className="mt-2 text-sm text-slate">This page doesn't exist. Let's get you back on track.</p>
      <Link to="/" className="mt-6 rounded-lg bg-sky px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-dark">
        Back to home
      </Link>
    </div>
  )
}
