import { NextRequest } from 'next/server';
import { getSettings, updateSettings } from '@/infrastructure/repositories/SettingsRepository';
import { ApiResponse } from '@/lib/api-helpers';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const settings = await getSettings();
    return ApiResponse.ok({ settings });
  } catch (error) {
    logger.error('[GET /api/settings]', error);
    return ApiResponse.internalError('Failed to fetch settings');
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const data = await req.json();
    const settings = await updateSettings(data);
    return ApiResponse.ok({ settings });
  } catch (error) {
    logger.error('[PATCH /api/settings]', error);
    return ApiResponse.internalError('Failed to update settings');
  }
}
