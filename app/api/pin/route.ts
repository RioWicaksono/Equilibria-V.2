import { NextRequest, NextResponse } from 'next/server';
import { getPin, setPin, clearPin } from '@/infrastructure/repositories/PinRepository';

export async function GET() {
  const hash = await getPin();
  return NextResponse.json({ success: true, hasPin: hash !== null });
}

export async function POST(req: NextRequest) {
  try {
    const { pin } = await req.json();
    if (!pin || pin.length !== 6) {
      return NextResponse.json({ success: false, message: 'PIN must be 6 digits' }, { status: 400 });
    }
    const bcrypt = await import('bcryptjs');
    const hash = await bcrypt.hash(pin, 10);
    await setPin(hash);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, message: 'Failed to save PIN' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    await clearPin();
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, message: 'Failed to delete PIN' }, { status: 500 });
  }
}
