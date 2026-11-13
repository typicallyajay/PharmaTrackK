import { NextRequest, NextResponse } from 'next/server';
import { getUserByMobileOrEmail, getPharmacyByOwnerId } from '@/lib/db';
import { comparePassword, createSession } from '@/lib/auth/session';

export async function POST(req: NextRequest) {
  try {
    const { identifier, password } = await req.json();

    if (!identifier || !password) {
      return NextResponse.json(
        { error: 'Mobile number/email and password are required.' },
        { status: 400 }
      );
    }

    const user = await getUserByMobileOrEmail(identifier);
    if (!user) {
      return NextResponse.json(
        { error: 'No account found with that mobile number or email.' },
        { status: 401 }
      );
    }

    const isValid = await comparePassword(password, user.password_hash);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid password. Please check and try again.' },
        { status: 401 }
      );
    }

    let pharmacyId: number | null = null;
    if (user.role === 'pharmacy_admin') {
      const pharmacy = await getPharmacyByOwnerId(user.user_id);
      pharmacyId = pharmacy ? pharmacy.pharmacy_id : null;
    }

    const sessionUser = {
      user_id: user.user_id,
      name: user.name,
      mobile: user.mobile,
      email: user.email,
      role: user.role,
      pharmacy_id: pharmacyId,
    };

    await createSession(sessionUser);

    return NextResponse.json({
      success: true,
      user: sessionUser,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Authentication error' },
      { status: 500 }
    );
  }
}
