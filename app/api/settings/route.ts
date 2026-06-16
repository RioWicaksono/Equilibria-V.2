import { NextRequest } from 'next/server';
import { getSettings, updateSettings } from '@/infrastructure/repositories/SettingsRepository';
import { ApiResponse } from '@/lib/api-helpers';

export async function GET() {
  try {
    const settings = await getSettings();
    return ApiResponse.ok({ settings });
  } catch (error) {
    return ApiResponse.internalError();
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const data = await req.json();
    const settings = await updateSettings(data);
    return ApiResponse.ok({ settings });
  } catch {
    return ApiResponse.internalError();
  }
}
