import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { updatePharmacyStatus } from '@/lib/db';
import { PharmacyStatus } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { pharmacy_id, status } = await req.json();
    if (!pharmacy_id || !status) {
      return NextResponse.json(
        { error: 'Pharmacy ID and status are required.' },
        { status: 400 }
      );
    }

    const success = await updatePharmacyStatus(
      Number(pharmacy_id),
      status as PharmacyStatus
    );

    return NextResponse.json({ success });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
