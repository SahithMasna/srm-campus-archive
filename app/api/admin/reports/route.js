import { NextResponse } from 'next/server';
import { createClient, createServiceClient, requireUser, isAdmin } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await requireUser();
  if (!user || !(await isAdmin(user))) {
    return NextResponse.json({ error: 'Moderators only.' }, { status: 403 });
  }

  const svc = createServiceClient();
  const { data, error } = await svc
    .from('reports')
    .select('id, reason, status, created_at, photos(id, caption, location_id, taken_on, storage_path, status, profiles(handle))')
    .eq('status', 'open')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const supabase = createClient();
  const paths = data.map((r) => r.photos?.storage_path).filter(Boolean);
  const { data: signed } = paths.length
    ? await supabase.storage.from('photos').createSignedUrls(paths, 3600)
    : { data: [] };
  const urlFor = Object.fromEntries((signed || []).map((s) => [s.path, s.signedUrl]));

  return NextResponse.json({
    reports: data.map((r) => ({
      id: r.id,
      reason: r.reason,
      filedAt: r.created_at,
      photo: r.photos && {
        id: r.photos.id,
        caption: r.photos.caption,
        locationId: r.photos.location_id,
        takenOn: r.photos.taken_on,
        by: r.photos.profiles?.handle || 'srm member',
        status: r.photos.status,
        url: urlFor[r.photos.storage_path] || null,
      },
    })),
  });
}

// action: 'remove' takes the photo down, 'dismiss' keeps it up.
export async function PATCH(request) {
  const user = await requireUser();
  if (!user || !(await isAdmin(user))) {
    return NextResponse.json({ error: 'Moderators only.' }, { status: 403 });
  }

  const { reportId, photoId, action } = await request.json();
  const svc = createServiceClient();

  if (action === 'remove') {
    await svc.from('photos').update({ status: 'removed' }).eq('id', photoId);
    await svc.from('reports').update({ status: 'removed' }).eq('photo_id', photoId);
  } else {
    await svc.from('reports').update({ status: 'dismissed' }).eq('id', reportId);
  }
  return NextResponse.json({ ok: true });
}
