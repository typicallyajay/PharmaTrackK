import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getPharmacyByOwnerId, updatePharmacyProfile } from '@/lib/db';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'pharmacy_admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const pharmacy = await getPharmacyByOwnerId(session.user_id);
  return NextResponse.json({ pharmacy });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'pharmacy_admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const pharmacy = await getPharmacyByOwnerId(session.user_id);
  if (!pharmacy) {
    return NextResponse.json({ error: 'Pharmacy not found' }, { status: 404 });
  }

  try {
    const body = await req.json();
    const { pharmacy_name, address, locality, city, phone, latitude, longitude } = body;

    const success = await updatePharmacyProfile(pharmacy.pharmacy_id, {
      pharmacy_name: pharmacy_name?.trim(),
      address: address?.trim(),
      locality: locality?.trim(),
      city: city?.trim(),
      phone: phone?.trim(),
      latitude: latitude ? Number(latitude) : null,
      longitude: longitude ? Number(longitude) : null,
    });

    return NextResponse.json({ success });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
