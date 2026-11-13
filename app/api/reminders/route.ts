import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getReminders, addReminder, deleteReminder } from '@/lib/db';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Login required' }, { status: 401 });
  }

  const reminders = await getReminders(session.user_id);
  return NextResponse.json({ reminders });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Login required' }, { status: 401 });
  }

  try {
    const { medicine_name, dosage, frequency, reminder_time } = await req.json();

    if (!medicine_name || !reminder_time) {
      return NextResponse.json(
        { error: 'Medicine name and reminder time are required.' },
        { status: 400 }
      );
    }

    const newReminder = await addReminder(session.user_id, {
      medicine_name: medicine_name.trim(),
      dosage: dosage?.trim(),
      frequency: frequency?.trim() || 'Daily',
      reminder_time,
    });

    return NextResponse.json({ success: true, reminder: newReminder });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Login required' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Reminder ID is required' }, { status: 400 });
  }

  const success = await deleteReminder(Number(id), session.user_id);
  return NextResponse.json({ success });
}
