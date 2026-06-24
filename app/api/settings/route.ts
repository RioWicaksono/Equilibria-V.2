import { NextRequest } from 'next/server';
import { getSettings, updateSettings } from '@/infrastructure/repositories/SettingsRepository';
import { ApiResponse } from '@/lib/api-helpers';
import { logger } from '@/lib/logger';
import { authenticateRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const auth = authenticateRequest(req);
  if (!auth.authenticated) {
    return ApiResponse.unauthorized(auth.reason || 'Authentication required');
  }

  try {
    const settings = await getSettings();

    return ApiResponse.ok({
      settings: {
        ...settings,
        pinEnabled: settings.isPinEnabled,
        hasPin: !!settings.pinHash,
        lockoutActive: settings.lockoutUntil
          ? new Date(settings.lockoutUntil) > new Date()
          : false,
      }
    });
  } catch (error) {
    logger.error('[GET /api/settings]', error);
    return ApiResponse.internalError('Failed to fetch settings');
  }
}

export async function PATCH(req: NextRequest) {
  const auth = authenticateRequest(req);
  if (!auth.authenticated) {
    return ApiResponse.unauthorized(auth.reason || 'Authentication required');
  }

  try {
    const data = await req.json();

    const allowedFields = new Set([
      'theme',
      'language',
      'currency',
      'autoLockTimeout',
      'telegramToken',
      'isPinEnabled',
      'pinHash',
      'pinSalt',
      'failedAttempts',
      'lockoutUntil',
    ]);

    const updateData: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      if (allowedFields.has(key)) {
        updateData[key] = value;
      }
    }

    const settings = await updateSettings(updateData);

    return ApiResponse.ok({
      settings: {
        ...settings,
        pinEnabled: settings.isPinEnabled,
        hasPin: !!settings.pinHash,
        lockoutActive: settings.lockoutUntil
          ? new Date(settings.lockoutUntil) > new Date()
          : false,
      }
    });
  } catch (error) {
    logger.error('[PATCH /api/settings]', error);
    return ApiResponse.internalError('Failed to update settings');
  }
}
