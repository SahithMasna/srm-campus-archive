'use client';

import { useState } from 'react';
import { LOCATIONS, CATEGORIES } from '@/lib/locations';

const today = () => new Date().toISOString().slice(0, 10);

export default function UploadDialog({ onClose, onPosted, toast }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [locationId, setLocationId] = useState(LOCATIONS[0].id);
  const [takenOn, setTakenOn] = useState(today());
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [caption, setCaption] = useState('');
  const [allowDownload, setAllowDownload] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function pick(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setError('');
  }

  async function post() {
    if (!file) return setError('Choose a photo first.');
    if (caption.trim().length < 3) return setError('Add a caption so people can find it later.');

    setBusy(true);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('location_id', locationId);
    fd.append('taken_on', takenOn);
    fd.append('category', category);
    fd.append('caption', caption.trim());
    fd.append('allow_download', String(allowDownload));

    const res = await fetch('/api/photos', { method: 'POST', body: fd });
    const body = await res.json();
    setBusy(false);

    if (!res.ok) return setError(body.error || 'Upload failed.');
    toast('Posted. It is on the map now.');
    onPosted(locationId);
  }

  return (
    <div className="scrim" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label="Add a campus photo">
        <h3>Add a campus photo</h3>

        <label className="drop">
          <input type="file" accept="image/*" onChange={pick} hidden />
          {preview
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={preview} alt="Selected photo" />
            : <span>Choose a photo from your camera roll</span>}
        </label>

        <div className="row">
          <label htmlFor="loc">Where was this?</label>
          <select id="loc" className="input" value={locationId} onChange={(e) => setLocationId(e.target.value)}>
            {LOCATIONS.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        </div>

        <div className="two">
          <div className="row">
            <label htmlFor="date">When</label>
            <input id="date" className="input" type="date" max={today()} value={takenOn}
                   onChange={(e) => setTakenOn(e.target.value)} />
          </div>
          <div className="row">
            <label htmlFor="cat">Category</label>
            <select id="cat" className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div className="row">
          <label htmlFor="cap">Caption</label>
          <input id="cap" className="input" value={caption} maxLength={120}
                 placeholder="What is happening in this photo?"
                 onChange={(e) => setCaption(e.target.value)} />
        </div>

        <label className="toggle">
          <input type="checkbox" checked={allowDownload} onChange={(e) => setAllowDownload(e.target.checked)} />
          <span>Let others download it
            <small>Turn this off and the download button tells people you said no.</small>
          </span>
        </label>

        <p className="note">
          Your photo is stripped of EXIF data (including GPS) and watermarked with your handle before it is stored.
          A watermark discourages casual reposting — it cannot stop a screenshot. Post accordingly.
        </p>

        {error && <div className="err" role="alert">{error}</div>}

        <div className="actions">
          <button className="btn-quiet" onClick={onClose} disabled={busy}>Cancel</button>
          <button className="btn" onClick={post} disabled={busy}>{busy ? 'Posting…' : 'Post to archive'}</button>
        </div>
      </div>
    </div>
  );
}
