import { NextResponse } from 'next/server';
import sharp from 'sharp';
import { createClient, requireUser } from '@/lib/supabase/server';
import { locationById, CATEGORIES } from '@/lib/locations';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SIGNED_URL_TTL = 60 * 60; // 1 hour

// ---------------- list ----------------
export async function GET(request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });

  const supabase = createClient();
  const p = request.nextUrl.searchParams;

  let q = supabase
    .from('photos')
    .select('id, storage_path, location_id, taken_on, category, caption, allow_download, owner_id, created_at, profiles(handle)')
    .eq('status', 'live')
    .order('taken_on', { ascending: false })
    .limit(Number(p.get('limit') || 120));

  if (p.get('location')) q = q.eq('location_id', p.get('location'));
  if (p.get('category') && p.get('category') !== 'All') q = q.eq('category', p.get('category'));
  if (p.get('month')) {
    const start = `${p.get('month')}-01`;
    const end = new Date(new Date(start).setMonth(new Date(start).getMonth() + 1))
      .toISOString()
      .slice(0, 10);
    q = q.gte('taken_on', start).lt('taken_on', end);
  }

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const paths = data.map((d) => d.storage_path);
  const { data: signed } = paths.length
    ? await supabase.storage.from('photos').createSignedUrls(paths, SIGNED_URL_TTL)
    : { data: [] };
  const urlFor = Object.fromEntries((signed || []).map((s) => [s.path, s.signedUrl]));

  return NextResponse.json({
    photos: data.map((d) => ({
      id: d.id,
      url: urlFor[d.storage_path] || null,
      locationId: d.location_id,
      takenOn: d.taken_on,
      category: d.category,
      caption: d.caption,
      allowDownload: d.allow_download,
      by: d.profiles?.handle || 'srm member',
      mine: d.owner_id === user.id,
    })),
  });
}

// ---------------- upload ----------------
export async function POST(request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });

  const domain = process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN || 'srmap.edu.in';
  if (!(user.email || '').toLowerCase().endsWith('@' + domain)) {
    return NextResponse.json({ error: `Only @${domain} accounts can post.` }, { status: 403 });
  }

  const form = await request.formData();
  const file = form.get('file');
  const locationId = String(form.get('location_id') || '');
  const takenOn = String(form.get('taken_on') || '');
  const category = String(form.get('category') || '');
  const caption = String(form.get('caption') || '').trim();
  const allowDownload = form.get('allow_download') === 'true';

  if (!file || typeof file === 'string') return NextResponse.json({ error: 'Choose a photo.' }, { status: 400 });
  if (file.size > 12 * 1024 * 1024) return NextResponse.json({ error: 'Photo must be under 12 MB.' }, { status: 400 });
  if (!locationId || !locationById(locationId)) return NextResponse.json({ error: 'Pick a campus location.' }, { status: 400 });
  if (!CATEGORIES.includes(category)) return NextResponse.json({ error: 'Pick a category.' }, { status: 400 });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(takenOn)) return NextResponse.json({ error: 'Pick the date it was taken.' }, { status: 400 });
  if (caption.length < 3) return NextResponse.json({ error: 'Add a caption so people can find it later.' }, { status: 400 });

  const handle = (user.email || '').split('@')[0];
  const input = Buffer.from(await file.arrayBuffer());

  // Strip EXIF (removes GPS and device data), cap the long edge, watermark.
  let image = sharp(input, { failOn: 'none' }).rotate();
  const meta = await image.metadata();
  const maxEdge = 2000;
  if (Math.max(meta.width || 0, meta.height || 0) > maxEdge) {
    image = image.resize({ width: maxEdge, height: maxEdge, fit: 'inside' });
  }
  const base = await image.jpeg({ quality: 86 }).toBuffer();
  const { width, height } = await sharp(base).metadata();

  const fontSize = Math.max(14, Math.round(width * 0.022));
  const pad = Math.round(fontSize * 0.8);
  const label = `srm archive · @${handle}`;
  const svg = Buffer.from(
    `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
       <text x="${width - pad}" y="${height - pad}" text-anchor="end"
             font-family="Helvetica, Arial, sans-serif" font-size="${fontSize}"
             fill="#ffffff" fill-opacity="0.82"
             stroke="#000000" stroke-opacity="0.35" stroke-width="${Math.max(1, fontSize * 0.06)}"
             paint-order="stroke">${label}</text>
     </svg>`
  );
  const watermarked = await sharp(base)
    .composite([{ input: svg, gravity: 'southeast' }])
    .jpeg({ quality: 86 })
    .toBuffer();

  const supabase = createClient();
  const path = `${user.id}/${crypto.randomUUID()}.jpg`;
  const { error: upErr } = await supabase.storage
    .from('photos')
    .upload(path, watermarked, { contentType: 'image/jpeg', cacheControl: '3600' });
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

  const { data, error } = await supabase
    .from('photos')
    .insert({
      owner_id: user.id,
      storage_path: path,
      location_id: locationId,
      taken_on: takenOn,
      category,
      caption,
      allow_download: allowDownload,
      width,
      height,
    })
    .select('id')
    .single();

  if (error) {
    await supabase.storage.from('photos').remove([path]);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: data.id });
}
