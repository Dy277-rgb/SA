export default function PassengerForm({ index, data, onChange }) {
  function update(field, value) {
    onChange(index, { ...data, [field]: value })
  }

  return (
    <div className="rounded-xl border border-slate-light/30 p-4">
      <h4 className="mb-3 text-sm font-semibold text-ink">Passenger {index + 1}</h4>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate">First name</label>
          <input
            required
            value={data.firstName || ''}
            onChange={(e) => update('firstName', e.target.value)}
            className="w-full rounded-lg border border-slate-light/40 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate">Last name</label>
          <input
            required
            value={data.lastName || ''}
            onChange={(e) => update('lastName', e.target.value)}
            className="w-full rounded-lg border border-slate-light/40 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate">Date of birth</label>
          <input
            required
            type="date"
            value={data.dob || ''}
            onChange={(e) => update('dob', e.target.value)}
            className="w-full rounded-lg border border-slate-light/40 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate">Passport number</label>
          <input
            required
            value={data.passport || ''}
            onChange={(e) => update('passport', e.target.value)}
            className="w-full rounded-lg border border-slate-light/40 px-3 py-2 text-sm"
          />
        </div>
      </div>
    </div>
  )
}
