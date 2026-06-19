import { NextRequest } from 'next/server';
import { getSettings, updateSettings } from '@/infrastructure/repositories/SettingsRepository';
import { ApiResponse } from '@/lib/api-helpers';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const settings = await getSettings();

    // Include PIN status in main settings response
    // This eliminates the need for separate /api/settings/pin GET call
    return ApiResponse.ok({
      settings: {
        ...settings,
        // PIN status is already included in settings from getSettings()
        // Just ensure it's properly exposed
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
  try {
    const data = await req.json();

    // Validate allowed fields
    const allowedFields = [
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
    ];

    const updateData: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      if (allowedFields.includes(key)) {
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
