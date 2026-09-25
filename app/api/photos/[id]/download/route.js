import { NextResponse } from 'next/server';
import { createClient, requireUser, isAdmin } from '@/lib/supabase/server';

export const runtime = 'nodejs';

// The uploader's download setting is enforced here, on the server.
// The bucket is private, so there is no URL to share around it.
export async function GET(_request, { params }) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });

  const supabase = createClient();
  const { data: photo } = await supabase
    .from('photos')
    .select('storage_path, allow_download, owner_id, caption')
    .eq('id', params.id)
    .eq('status', 'live')
    .single();

  if (!photo) return NextResponse.json({ error: 'Photo not found.' }, { status: 404 });

  const permitted = photo.allow_download || photo.owner_id === user.id || (await isAdmin(user));
  if (!permitted) {
    return NextResponse.json({ error: 'The uploader has turned downloads off for this photo.' }, { status: 403 });
  }

  const name = photo.caption.replace(/[^a-z0-9]+/gi, '-').slice(0, 40).toLowerCase() || 'srm-archive';
  const { data, error } = await supabase.storage
    .from('photos')
    .createSignedUrl(photo.storage_path, 60, { download: `${name}.jpg` });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ url: data.signedUrl });
}
