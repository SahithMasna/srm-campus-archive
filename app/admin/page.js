'use client';

import { useCallback, useEffect, useState } from 'react';
import { locationName } from '@/lib/locations';

export default function Admin() {
  const [reports, setReports] = useState([]);
  const [denied, setDenied] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/admin/reports');
    if (res.status === 403) { setDenied(true); setLoading(false); return; }
    const body = await res.json();
    setReports(body.reports || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function act(report, action) {
    await fetch('/api/admin/reports', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reportId: report.id, photoId: report.photo?.id, action }),
    });
    load();
  }

  if (denied) {
    return (
      <div className="shell">
        <main><div className="empty">This page is for moderators. Ask a club admin to add your email.</div></main>
      </div>
    );
  }

  return (
    <div className="shell">
      <header className="bar">
        <div className="brand">Moderation queue</div>
        <div className="spacer" />
        <a className="btn-quiet" href="/">Back to the map</a>
      </header>

      <main>
        <div className="lede">
          <h2>Reported photos</h2>
          <p>Removing a photo takes it off the map immediately. The file is kept, so a mistake can be undone in the database.</p>
        </div>

        {loading && <div className="empty">Loading…</div>}
        {!loading && !reports.length && <div className="empty">Nothing reported. The queue is clear.</div>}

        <div className="queue">
          {reports.map((r) => (
            <div className="report" key={r.id}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {r.photo?.url && <img src={r.photo.url} alt={r.photo.caption} />}
              <div className="report-body">
                <b>{r.photo?.caption}</b>
                <p className="meta">
                  {locationName(r.photo?.locationId)} · posted by @{r.photo?.by}
                </p>
                <p className="reason">&ldquo;{r.reason}&rdquo;</p>
                <div className="actions">
                  <button className="btn-quiet" onClick={() => act(r, 'dismiss')}>Keep it up</button>
                  <button className="btn" onClick={() => act(r, 'remove')}>Remove photo</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
