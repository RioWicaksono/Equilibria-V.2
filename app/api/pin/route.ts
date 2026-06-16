import { NextRequest } from 'next/server';
import { getPin, setPin, verifyPin, clearPin } from '@/infrastructure/repositories/PinRepository';
import { ApiResponse } from '@/lib/api-helpers';

export async function GET() {
  const hash = await getPin();
  return ApiResponse.ok({ hasPin: hash !== null });
}

export async function POST(req: NextRequest) {
  try {
    const { pin } = await req.json();
    if (!pin || pin.length !== 6) {
      return ApiResponse.badRequest('PIN must be 6 digits');
    }
    const bcrypt = await import('bcryptjs');
    const hash = await bcrypt.hash(pin, 10);
    await setPin(hash);
    return ApiResponse.ok({ success: true });
  } catch {
    return ApiResponse.internalError();
  }
}

export async function DELETE() {
  await clearPin();
  return ApiResponse.ok({ success: true });
}
