export function StatCard({ title, value, unit = '', note = '' }) {
  return (
    <article className="stat-card">
      <p className="stat-title">{title}</p>
      <p className="stat-value">
        {value}
        {unit ? <span className="stat-unit"> {unit}</span> : null}
      </p>
      {note ? <p className="stat-note">{note}</p> : null}
    </article>
  )
}
