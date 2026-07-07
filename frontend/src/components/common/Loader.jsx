import { Loader2 } from 'lucide-react'

export default function Loader({ label = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate">
      <Loader2 className="animate-spin text-sky" size={28} />
      <p className="text-sm">{label}</p>
    </div>
  )
}
