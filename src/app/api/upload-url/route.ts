import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { MAX_PHOTO_BYTES } from '@/lib/slots';

export const runtime = 'nodejs';

const EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
};

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const type = body?.contentType as string | undefined;
  const size = Number(body?.size);

  if (!type || !EXT[type]) {
    return NextResponse.json({ error: 'Please upload a JPG, PNG, WebP or HEIC image.' }, { status: 400 });
  }
  if (!Number.isFinite(size) || size <= 0 || size > MAX_PHOTO_BYTES) {
    return NextResponse.json({ error: 'Photo must be under 8MB.' }, { status: 400 });
  }

  const path = `inspiration/${crypto.randomUUID()}.${EXT[type]}`;
  const { data, error } = await supabase.storage.from('inspiration-photos').createSignedUploadUrl(path);
  if (error || !data) {
    console.error(error);
    return NextResponse.json({ error: 'Could not prepare the upload. Please try again.' }, { status: 500 });
  }
  return NextResponse.json({ path: data.path, token: data.token });
}