import { NextResponse } from 'next/server';
import { getRoleAdmin } from '@/lib/admin';

export async function GET() {
  if (!(await getRoleAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json({ allowed: true });
}