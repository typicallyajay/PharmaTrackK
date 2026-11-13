import { NextRequest, NextResponse } from 'next/server';
import { getUserByMobileOrEmail, createUser, createPharmacy } from '@/lib/db';
import { hashPassword, createSession } from '@/lib/auth/session';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      mobile,
      email,
      password,
      role = 'user',
      pharmacy_name,
      address,
      locality,
      city = 'Abu Road',
      phone,
      latitude,
      longitude,
    } = body;

    if (!name || !mobile || !password) {
      return NextResponse.json(
        { error: 'Name, mobile number, and password are required.' },
        { status: 400 }
      );
    }

    const cleanMobile = mobile.trim();
    const existing = await getUserByMobileOrEmail(cleanMobile);
    if (existing) {
      return NextResponse.json(
        { error: 'An account with this mobile number already exists.' },
        { status: 400 }
      );
    }

    if (email && email.trim()) {
      const existingEmail = await getUserByMobileOrEmail(email.trim());
      if (existingEmail) {
        return NextResponse.json(
          { error: 'An account with this email address already exists.' },
          { status: 400 }
        );
      }
    }

    const passwordHash = await hashPassword(password);

    const newUser = await createUser({
      name: name.trim(),
      mobile: cleanMobile,
      email: email?.trim() || undefined,
      password_hash: passwordHash,
      role: role === 'pharmacy_admin' ? 'pharmacy_admin' : 'user',
    });

    let pharmacyId: number | null = null;
    if (role === 'pharmacy_admin') {
      if (!pharmacy_name || !address || !locality || !phone) {
        return NextResponse.json(
          { error: 'Pharmacy name, address, locality, and contact phone are required.' },
          { status: 400 }
        );
      }

      const newPharmacy = await createPharmacy({
        owner_user_id: newUser.user_id,
        pharmacy_name: pharmacy_name.trim(),
        address: address.trim(),
        locality: locality.trim(),
        city: (city || 'Abu Road').trim(),
        phone: phone.trim(),
        latitude: latitude ? Number(latitude) : null,
        longitude: longitude ? Number(longitude) : null,
        status: 'pending', // Requires admin verification
      });
      pharmacyId = newPharmacy.pharmacy_id;
    }

    const sessionUser = {
      user_id: newUser.user_id,
      name: newUser.name,
      mobile: newUser.mobile,
      email: newUser.email,
      role: newUser.role,
      pharmacy_id: pharmacyId,
    };

    await createSession(sessionUser);

    return NextResponse.json({
      success: true,
      user: sessionUser,
      message:
        role === 'pharmacy_admin'
          ? 'Registration successful! Your pharmacy account is under review and will appear in public search once verified by the administrator.'
          : 'Registration successful! Welcome to PharmaTrack.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Registration failed' },
      { status: 500 }
    );
  }
}
