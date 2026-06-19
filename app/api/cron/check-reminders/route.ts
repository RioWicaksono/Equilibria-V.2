import { NextRequest, NextResponse } from 'next/server';
import { getUpcomingReminders, completeReminder } from '@/lib/cron';
import { withCronAuth } from '@/lib/cronAuth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const getHandler = async () => {
  try {
    const result = await getUpcomingReminders(7);

    return NextResponse.json({
      success: true,
      message: `Found ${result.reminders.length} upcoming reminders`,
      reminders: result.reminders,
    });
  } catch (error) {
    console.error('Check reminders cron error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to check reminders',
    }, { status: 500 });
  }
};

const postHandler = async (request: Request) => {
  try {
    const body = await request.json();
    const { reminderId } = body;

    if (!reminderId) {
      return NextResponse.json({
        success: false,
        error: 'reminderId is required',
      }, { status: 400 });
    }

    const result = await completeReminder(reminderId);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Reminder completed',
        nextOccurrence: result.nextOccurrence,
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error,
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Complete reminder error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to complete reminder',
    }, { status: 500 });
  }
};

// Apply cron authentication
export const GET = withCronAuth(getHandler);
export const POST = withCronAuth(postHandler);
