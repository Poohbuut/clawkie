import { supabase } from '@/lib/supabase';
import { MAX_PHOTO_BYTES } from '@/lib/slots';

export function isValidDesignImage(file: FormDataEntryValue | null): file is File {
  return file instanceof File && file.size > 0 && file.size <= MAX_PHOTO_BYTES && file.type.startsWith('image/');
}

export async function uploadDesignImage(file: File): Promise<{ path: string; url: string } | null> {
  const path = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-80)}`;
  const { error } = await supabase.storage.from('nail-designs').upload(
    path,
    Buffer.from(await file.arrayBuffer()),
    { contentType: file.type },
  );
  if (error) return null;
  return { path, url: supabase.storage.from('nail-designs').getPublicUrl(path).data.publicUrl };
}