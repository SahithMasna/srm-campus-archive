'use client';

import { locationName } from '@/lib/locations';

const fmt = (d) =>
  new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

export default function PhotoGrid({ photos, onOpen, emptyMessage }) {
  if (!photos.length) {
    return <div className="empty">{emptyMessage || 'Nothing here yet. Add the first photo and it appears on the map straight away.'}</div>;
  }

  return (
    <div className="grid">
      {photos.map((p) => (
        <button key={p.id} className="tile" onClick={() => onOpen(p)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={p.url} alt={p.caption} loading="lazy" />
          <span className="cap">
            <b>{p.caption}</b>
            <i>{locationName(p.locationId)} · {fmt(p.takenOn)}</i>
          </span>
        </button>
      ))}
    </div>
  );
}
