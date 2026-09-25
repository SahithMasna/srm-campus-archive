import { NextResponse } from 'next/server';
import { createClient, requireUser } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function POST(request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });

  const { photoId, reason } = await request.json();
  if (!photoId) return NextResponse.json({ error: 'Missing photo.' }, { status: 400 });

  const supabase = createClient();
  const { error } = await supabase.from('reports').insert({
    photo_id: photoId,
    reporter_id: user.id,
    reason: (reason || 'No reason given').slice(0, 500),
  });

  // Reporting the same photo twice is not an error worth showing anyone.
  if (error && !error.message.includes('duplicate')) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
