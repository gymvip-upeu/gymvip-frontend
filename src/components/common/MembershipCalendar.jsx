import React from 'react';

// Dates come from the server; UTC is used only to lay out calendar cells.
export default function MembershipCalendar({ start, last }) {
  const first = new Date(`${start}T00:00:00Z`);
  const end = new Date(`${last}T00:00:00Z`);
  const months = [];
  for (let month = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth(), 1));
       month <= end;
       month = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 1))) {
    const year = month.getUTCFullYear(), number = month.getUTCMonth();
    const offset = (month.getUTCDay() + 6) % 7;
    const days = new Date(Date.UTC(year, number + 1, 0)).getUTCDate();
    months.push(<section key={month.toISOString()} className="membership-calendar-month">
      <h4>{month.toLocaleDateString('es-PE', { month: 'long', year: 'numeric', timeZone: 'UTC' })}</h4>
      <div className="membership-calendar-grid">
        {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((day, i) => <span key={`day-${i}`} aria-hidden="true">{day}</span>)}
        {Array.from({ length: offset }, (_, i) => <span key={`blank-${i}`} />)}
        {Array.from({ length: days }, (_, i) => {
          const date = new Date(Date.UTC(year, number, i + 1)).toISOString().slice(0, 10);
          return <span key={date} className={date >= start && date <= last ? 'covered' : ''}
            title={`${date}${date >= start && date <= last ? ': incluido' : ''}`}>{i + 1}</span>;
        })}
      </div>
    </section>);
  }
  return <div className="membership-calendars" aria-label={`Periodo incluido del ${start} al ${last}`}>{months}</div>;
}
