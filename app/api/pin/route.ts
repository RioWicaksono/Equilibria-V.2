import { NextRequest, NextResponse } from 'next/server';
import { getPin, setPin, clearPin } from '@/infrastructure/repositories/PinRepository';

// GET - returns hasPin status (for settings) or hash (for verification)
// To get hash, pass ?verify=true header or query param
export async function GET(req: NextRequest) {
  const hash = await getPin();
  const url = new URL(req.url);
  const verify = url.searchParams.get('verify') || req.headers.get('x-verify-pin');

  // If verification is requested, return the hash
  if (verify) {
    if (!hash) {
      return NextResponse.json({ success: false, message: 'No PIN set' }, { status: 404 });
    }
    return NextResponse.json({ success: true, hasPin: true, hash });
  }

  // Default: return only hasPin status
  return NextResponse.json({ success: true, hasPin: hash !== null });
}

export async function POST(req: NextRequest) {
  try {
    const { pin } = await req.json();
    if (!pin || pin.length !== 6) {
      return NextResponse.json({ success: false, message: 'PIN harus 6 digit' }, { status: 400 });
    }
    const bcrypt = await import('bcryptjs');
    const hash = await bcrypt.hash(pin, 10);
    await setPin(hash);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('PIN save error:', err);
    return NextResponse.json({ success: false, message: 'Gagal menyimpan PIN' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    await clearPin();
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, message: 'Gagal menghapus PIN' }, { status: 500 });
  }
}
