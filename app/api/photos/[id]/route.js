import { NextResponse } from 'next/server';
import { createClient, requireUser, isAdmin } from '@/lib/supabase/server';

export const runtime = 'nodejs';

// Soft delete: the file stays until an admin purges it, so a wrongly
// removed photo can be restored.
export async function DELETE(_request, { params }) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });

  const supabase = createClient();
  const { data: photo } = await supabase
    .from('photos')
    .select('id, owner_id')
    .eq('id', params.id)
    .single();

  if (!photo) return NextResponse.json({ error: 'Photo not found.' }, { status: 404 });
  if (photo.owner_id !== user.id && !(await isAdmin(user))) {
    return NextResponse.json({ error: 'You can only remove your own photos.' }, { status: 403 });
  }

  const { error } = await supabase.from('photos').update({ status: 'removed' }).eq('id', params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
