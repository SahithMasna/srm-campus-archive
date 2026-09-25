'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { LOCATIONS, CATEGORIES, locationName } from '@/lib/locations';
import PhotoGrid from '@/components/PhotoGrid';
import PhotoModal from '@/components/PhotoModal';
import UploadDialog from '@/components/UploadDialog';

// Leaflet touches window on import, so it cannot render on the server.
const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
  loading: () => <div className="map map-loading">Loading campus map…</div>,
});

const MONTHS = (() => {
  const out = [];
  const d = new Date();
  for (let i = 11; i >= 0; i--) {
    const m = new Date(d.getFullYear(), d.getMonth() - i, 1);
    out.push(m.toISOString().slice(0, 7));
  }
  return out;
})();

const monthLabel = (k) =>
  new Date(k + '-01T00:00:00').toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });

export default function Home() {
  const router = useRouter();
  const supabase = createClient();

  const [me, setMe] = useState(null);
  const [admin, setAdmin] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('map');
  const [selected, setSelected] = useState(null);
  const [category, setCategory] = useState('All');
  const [month, setMonth] = useState(null);
  const [open, setOpen] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const toast = useCallback((m) => {
    setToastMsg(m);
    setTimeout(() => setToastMsg(''), 2600);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/photos?limit=300');
    const body = await res.json();
    setPhotos(body.photos || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setMe(data.user));
    fetch('/api/admin/reports').then((r) => setAdmin(r.ok));
    load();
  }, [load, supabase]);

  const counts = useMemo(() => {
    const c = {};
    photos.forEach((p) => { c[p.locationId] = (c[p.locationId] || 0) + 1; });
    return c;
  }, [photos]);

  const filtered = useMemo(() => {
    let list = photos;
    if (view === 'map' && selected) list = list.filter((p) => p.locationId === selected);
    if (category !== 'All') list = list.filter((p) => p.category === category);
    if (view === 'time' && month) list = list.filter((p) => p.takenOn.slice(0, 7) === month);
    return list;
  }, [photos, view, selected, category, month]);

  async function signOut() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  const chips = (
    <div className="chips">
      {['All', ...CATEGORIES].map((c) => (
        <button key={c} className="chip" aria-pressed={category === c} onClick={() => setCategory(c)}>{c}</button>
      ))}
    </div>
  );

  return (
    <div className="shell">
      <header className="bar">
        <div className="brand">SRM Campus <span>Archive</span></div>
        <div className="spacer" />
        <div className="who"><span className="dot-ok" />{me?.email?.split('@')[0] || '…'}</div>
        <button className="btn" onClick={() => setUploading(true)}>Add photo</button>
        {admin && <a className="btn-quiet" href="/admin">Moderation</a>}
        <button className="btn-quiet" onClick={signOut}>Sign out</button>
      </header>

      <nav className="tabs" role="tablist">
        {[['map', 'Campus map'], ['recent', 'Recent'], ['time', 'Time machine']].map(([v, label]) => (
          <button key={v} className="tab" role="tab" aria-selected={view === v}
                  onClick={() => { setView(v); setSelected(null); setMonth(null); }}>
            {label}
          </button>
        ))}
      </nav>

      <main>
        {view === 'map' && (
          <>
            <div className="lede">
              <h2>The campus is the interface</h2>
              <p>Photos are organised around where they happened. Every pin shows how many live there.</p>
            </div>
            <div className="maprow">
              <MapView counts={counts} selected={selected} onSelect={(id) => { setSelected(id); setCategory('All'); }} />
              <div className="panel">
                {selected ? (
                  <>
                    <h3>{locationName(selected)}</h3>
                    <p className="meta">{counts[selected] || 0} photos</p>
                    {chips}
                    <PhotoGrid photos={filtered} onOpen={setOpen}
                               emptyMessage="No photos from this place yet. Be the first." />
                  </>
                ) : (
                  <>
                    <h3>Pick a place</h3>
                    <p className="meta">{LOCATIONS.length} campus locations · {photos.length} photos archived</p>
                    <div className="empty">Tap a pin on the map to open its photos.</div>
                  </>
                )}
              </div>
            </div>
          </>
        )}

        {view === 'recent' && (
          <>
            <div className="lede">
              <h2>Recent across campus</h2>
              <p>Everything the archive has picked up lately, newest first.</p>
            </div>
            {chips}
            {loading ? <div className="empty">Loading…</div> : <PhotoGrid photos={filtered} onOpen={setOpen} />}
          </>
        )}

        {view === 'time' && (
          <>
            <div className="lede">
              <h2>What did campus look like then?</h2>
              <p>{month ? `Showing ${monthLabel(month)}.` : 'Pick a month to replay it.'}</p>
            </div>
            <div className="months">
              {MONTHS.map((k) => {
                const n = photos.filter((p) => p.takenOn.slice(0, 7) === k).length;
                return (
                  <button key={k} className={`mo ${n ? '' : 'zero'}`} aria-pressed={month === k}
                          onClick={() => setMonth(month === k ? null : k)}>
                    <s>{n}</s><b>{monthLabel(k)}</b>
                  </button>
                );
              })}
            </div>
            {chips}
            <PhotoGrid photos={filtered} onOpen={setOpen} />
          </>
        )}
      </main>

      {open && <PhotoModal photo={open} onClose={() => setOpen(null)} onChanged={load} toast={toast} />}
      {uploading && (
        <UploadDialog
          toast={toast}
          onClose={() => setUploading(false)}
          onPosted={(loc) => { setUploading(false); setView('map'); setSelected(loc); load(); }}
        />
      )}
      {toastMsg && <div className="toast">{toastMsg}</div>}
    </div>
  );
}
