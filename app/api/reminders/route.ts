import { NextRequest } from 'next/server';
import { PrismaReminderRepository } from '@/infrastructure/repositories/PrismaReminderRepository';
import { ApiResponse } from '@/lib/api-helpers';
import { logger } from '@/lib/logger';
import { authenticateRequest } from '@/lib/auth';

const reminderRepo = new PrismaReminderRepository();

export async function GET(req: NextRequest) {
  const auth = authenticateRequest(req);
  if (!auth.authenticated) {
    return ApiResponse.unauthorized(auth.reason || 'Authentication required');
  }

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');

    let reminders;
    if (status) {
      reminders = await reminderRepo.findByStatus(status);
    } else if (priority) {
      reminders = await reminderRepo.findByPriority(priority);
    } else {
      reminders = await reminderRepo.findAll();
    }

    return ApiResponse.ok({ reminders });
  } catch (error) {
    logger.error('[GET /api/reminders]', error);
    return ApiResponse.internalError('Failed to fetch reminders');
  }
}

export async function POST(req: NextRequest) {
  const auth = authenticateRequest(req);
  if (!auth.authenticated) {
    return ApiResponse.unauthorized(auth.reason || 'Authentication required');
  }

  try {
    const body = await req.json();
    const { title, date, amount, status, priority, frequency, urgent } = body;

    if (!title || !date) {
      return ApiResponse.badRequest('Title and date are required');
    }

    // Validate date
    const dateObj = new Date(date);
    if (Number.isNaN(dateObj.getTime())) {
      return ApiResponse.badRequest('Invalid date format');
    }

    const reminder = await reminderRepo.save({
      title,
      date: dateObj,
      amount: amount ? parseFloat(amount) : null,
      status: status || 'PENDING',
      priority: priority || 'MEDIUM',
      frequency: frequency || 'ONCE',
      urgent: urgent || false
    });

    return ApiResponse.created({ reminder });
  } catch (error) {
    logger.error('[POST /api/reminders]', error);
    return ApiResponse.internalError('Failed to create reminder');
  }
}

export async function PATCH(req: NextRequest) {
  const auth = authenticateRequest(req);
  if (!auth.authenticated) {
    return ApiResponse.unauthorized(auth.reason || 'Authentication required');
  }

  try {
    const body = await req.json();
    const { id, ...data } = body;

    if (!id) {
      return ApiResponse.badRequest('Reminder ID is required');
    }

    if (data.date) {
      const dateObj = new Date(data.date);
      if (Number.isNaN(dateObj.getTime())) {
        return ApiResponse.badRequest('Invalid date format');
      }
      data.date = dateObj;
    }
    if (data.amount !== undefined) {
      data.amount = data.amount ? parseFloat(data.amount) : null;
    }

    const reminder = await reminderRepo.update(id, data);
    return ApiResponse.ok({ reminder });
  } catch (error) {
    logger.error('[PATCH /api/reminders]', error);
    return ApiResponse.internalError('Failed to update reminder');
  }
}

export async function DELETE(req: NextRequest) {
  const auth = authenticateRequest(req);
  if (!auth.authenticated) {
    return ApiResponse.unauthorized(auth.reason || 'Authentication required');
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return ApiResponse.badRequest('Reminder ID is required');
    }

    await reminderRepo.delete(id);
    return ApiResponse.noContent();
  } catch (error) {
    logger.error('[DELETE /api/reminders]', error);
    return ApiResponse.internalError('Failed to delete reminder');
  }
}
