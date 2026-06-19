import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getSettings, updateSettings } from '@/infrastructure/repositories/SettingsRepository';

const BCRYPT_ROUNDS = 12; // Cost factor 12 - secure and reasonably fast

export async function GET() {
  try {
    const settings = await getSettings();
    return NextResponse.json({
      success: true,
      isPinEnabled: settings.isPinEnabled,
      hasPin: !!settings.pinHash,
    });
  } catch (error) {
    console.error('[GET /api/settings/pin]', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch PIN status' }, { status: 500 });
  }
}

// POST - Enable PIN or Verify PIN
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const settings = await getSettings();

    // Enable PIN action
    if (body.action === 'enable') {
      // Hash PIN with bcrypt (handles salt automatically)
      const pinHash = await bcrypt.hash(body.pin, BCRYPT_ROUNDS);

      const updated = await updateSettings({
        isPinEnabled: true,
        pinHash,
        pinSalt: null, // bcrypt handles salt internally
        failedAttempts: 0,
        lockoutUntil: null,
      });
      return NextResponse.json({ success: true, settings: updated });
    }

    // Verify PIN action
    if (body.pin && settings.pinHash) {
      // Check lockout
      if (settings.lockoutUntil && new Date(settings.lockoutUntil) > new Date()) {
        const remaining = Math.ceil((new Date(settings.lockoutUntil).getTime() - Date.now()) / 1000);
        return NextResponse.json({
          success: false,
          error: 'Akun terkunci sementara',
          lockedOut: true,
          remainingSeconds: remaining,
        });
      }

      // Verify PIN using bcrypt (compares and handles salt automatically)
      const isValid = await bcrypt.compare(body.pin, settings.pinHash);

      if (isValid) {
        // Reset failed attempts on successful login
        await updateSettings({ failedAttempts: 0, lockoutUntil: null });
        return NextResponse.json({ success: true });
      }

      // Increment failed attempts
      const newAttempts = (settings.failedAttempts || 0) + 1;
      await updateSettings({ failedAttempts: newAttempts });

      return NextResponse.json({
        success: false,
        error: 'PIN salah',
        attempts: newAttempts,
      });
    }

    return NextResponse.json({ success: false, error: 'PIN not configured' });
  } catch (error) {
    console.error('[POST /api/settings/pin]', error);
    return NextResponse.json({ success: false, error: 'Failed to process PIN' }, { status: 500 });
  }
}

// PATCH - Update lockout status
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const updated = await updateSettings({
      failedAttempts: body.failedAttempts,
      lockoutUntil: body.lockoutUntil,
    });
    return NextResponse.json({ success: true, settings: updated });
  } catch (error) {
    console.error('[PATCH /api/settings/pin]', error);
    return NextResponse.json({ success: false, error: 'Failed to update PIN status' }, { status: 500 });
  }
}

// DELETE - Disable PIN
export async function DELETE() {
  try {
    const updated = await updateSettings({
      isPinEnabled: false,
      pinHash: null,
      pinSalt: null,
      failedAttempts: 0,
      lockoutUntil: null,
    });
    return NextResponse.json({ success: true, settings: updated });
  } catch (error) {
    console.error('[DELETE /api/settings/pin]', error);
    return NextResponse.json({ success: false, error: 'Failed to disable PIN' }, { status: 500 });
  }
}
