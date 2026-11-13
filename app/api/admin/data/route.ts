import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getSuperAdminStats, getAllPharmacies } from '@/lib/db';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'super_admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const stats = await getSuperAdminStats();
  const pharmacies = await getAllPharmacies();

  return NextResponse.json({ stats, pharmacies });
}
