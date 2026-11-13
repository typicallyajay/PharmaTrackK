import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { createSaleInvoice, getPharmacyByOwnerId } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'pharmacy_admin') {
      return NextResponse.json(
        { error: 'Unauthorized: Pharmacy admin access required.' },
        { status: 403 }
      );
    }

    const pharmacy = await getPharmacyByOwnerId(session.user_id);
    if (!pharmacy) {
      return NextResponse.json(
        { error: 'No associated pharmacy found for this account.' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { customer, items, billing } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'The checkout bill cannot be empty.' },
        { status: 400 }
      );
    }

    const invoice = await createSaleInvoice(
      pharmacy.pharmacy_id,
      customer || {},
      items,
      billing || { payment_method: 'cash' }
    );

    return NextResponse.json({
      success: true,
      invoice,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Checkout failed' },
      { status: 500 }
    );
  }
}
