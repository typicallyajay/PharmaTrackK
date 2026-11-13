import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getPharmacyByOwnerId, saveStockItem, deleteStockItem, getStockForPharmacy } from '@/lib/db';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'pharmacy_admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const pharmacy = await getPharmacyByOwnerId(session.user_id);
  if (!pharmacy) {
    return NextResponse.json({ error: 'Pharmacy not found' }, { status: 404 });
  }

  const stock = await getStockForPharmacy(pharmacy.pharmacy_id);
  return NextResponse.json({ stock });
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
    const {
      stock_id,
      medicine_name,
      generic_name,
      category,
      price,
      quantity,
      expiry_date,
    } = body;

    if (!medicine_name || price === undefined || quantity === undefined) {
      return NextResponse.json(
        { error: 'Medicine name, price, and quantity are required.' },
        { status: 400 }
      );
    }

    const saved = await saveStockItem({
      stock_id: stock_id ? Number(stock_id) : undefined,
      pharmacy_id: pharmacy.pharmacy_id,
      medicine_name: medicine_name.trim(),
      generic_name: generic_name?.trim() || null,
      category: category?.trim() || null,
      price: Number(price),
      quantity: Number(quantity),
      expiry_date: expiry_date || null,
    });

    return NextResponse.json({ success: true, item: saved });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'pharmacy_admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const pharmacy = await getPharmacyByOwnerId(session.user_id);
  if (!pharmacy) {
    return NextResponse.json({ error: 'Pharmacy not found' }, { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const stockId = searchParams.get('id');
  if (!stockId) {
    return NextResponse.json({ error: 'Stock ID is required' }, { status: 400 });
  }

  const success = await deleteStockItem(Number(stockId), pharmacy.pharmacy_id);
  return NextResponse.json({ success });
}
