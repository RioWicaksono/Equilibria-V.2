import { NextRequest } from 'next/server';
import { getSettings, updateSettings } from '@/infrastructure/repositories/SettingsRepository';
import { ApiResponse } from '@/lib/api-helpers';
import { logger } from '@/lib/logger';
import { authenticateRequest } from '@/lib/auth';
import { UpdateSettingsSchema } from '@/lib/validation';
import { ZodError } from 'zod';

function formatZodError(error: ZodError): string {
  return error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
}

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

    // Validate input with Zod schema
    const validation = UpdateSettingsSchema.safeParse(data);
    if (!validation.success) {
      return ApiResponse.badRequest('Invalid settings data', formatZodError(validation.error));
    }

    const settings = await updateSettings(validation.data);

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
