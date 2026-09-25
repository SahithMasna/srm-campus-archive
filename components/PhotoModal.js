'use client';

import { useEffect, useState } from 'react';
import { locationName } from '@/lib/locations';

const fmt = (d) =>
  new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

export default function PhotoModal({ photo, onClose, onChanged, toast }) {
  const [busy, setBusy] = useState(false);
  const [reported, setReported] = useState(false);

  useEffect(() => {
    const esc = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [onClose]);

  if (!photo) return null;

  async function download() {
    setBusy(true);
    const res = await fetch(`/api/photos/${photo.id}/download`);
    const body = await res.json();
    setBusy(false);
    if (!res.ok) return toast(body.error);
    window.open(body.url, '_blank');
  }

  async function report() {
    const reason = window.prompt('What is wrong with this photo?');
    if (reason === null) return;
    setBusy(true);
    const res = await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photoId: photo.id, reason }),
    });
    setBusy(false);
    if (!res.ok) return toast('Could not file the report.');
    setReported(true);
    toast('Reported. A moderator will look at it.');
  }

  async function remove() {
    if (!window.confirm('Remove this photo from the archive?')) return;
    setBusy(true);
    const res = await fetch(`/api/photos/${photo.id}`, { method: 'DELETE' });
    setBusy(false);
    if (!res.ok) return toast('Could not remove it.');
    toast('Photo removed.');
    onClose();
    onChanged();
  }

  return (
    <div className="scrim" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal wide" role="dialog" aria-modal="true" aria-label={photo.caption}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="full" src={photo.url} alt={photo.caption} />
        <h3>{photo.caption}</h3>
        <p className="meta">{locationName(photo.locationId)} · {fmt(photo.takenOn)}</p>
        <div className="kv"><span>Category</span><b>{photo.category}</b></div>
        <div className="kv"><span>Posted by</span><b>@{photo.by}</b></div>
        <div className="kv">
          <span>Downloads</span>
          <b>{photo.allowDownload ? 'Allowed by uploader' : 'Turned off by uploader'}</b>
        </div>
        <div className="actions">
          <button className="btn-quiet" onClick={report} disabled={busy || reported}>
            {reported ? 'Reported' : 'Report'}
          </button>
          {photo.mine && <button className="btn-quiet" onClick={remove} disabled={busy}>Remove</button>}
          <button className="btn-quiet" onClick={download} disabled={busy}>Download</button>
          <button className="btn" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
}
