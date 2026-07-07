export default function Button({ children, variant = 'primary', className = '', ...props }) {
  const base = 'inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed'
  const variants = {
    primary: 'bg-sky text-white hover:bg-sky-dark',
    secondary: 'bg-sunrise text-navy hover:bg-sunrise-dark hover:text-white',
    outline: 'border border-slate-light/50 text-ink hover:bg-mist',
    ghost: 'text-sky hover:bg-sky-light',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  }
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  )
}
