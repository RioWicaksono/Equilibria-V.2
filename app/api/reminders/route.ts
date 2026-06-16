import { NextResponse } from 'next/server';
import { PrismaReminderRepository } from '@/infrastructure/repositories/PrismaReminderRepository';

const reminderRepo = new PrismaReminderRepository();

export async function GET(req: Request) {
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

    return NextResponse.json({ reminders });
  } catch (error) {
    console.error('Failed to fetch reminders:', error);
    return NextResponse.json({ error: 'Failed to fetch reminders' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, date, amount, status, priority, frequency, urgent } = body;

    if (!title || !date) {
      return NextResponse.json({ error: 'Title and date are required' }, { status: 400 });
    }

    const reminder = await reminderRepo.save({
      title,
      date: new Date(date),
      amount: amount ? parseFloat(amount) : null,
      status: status || 'PENDING',
      priority: priority || 'MEDIUM',
      frequency: frequency || 'ONCE',
      urgent: urgent || false
    });

    return NextResponse.json({ reminder }, { status: 201 });
  } catch (error) {
    console.error('Failed to create reminder:', error);
    return NextResponse.json({ error: 'Failed to create reminder' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: 'Reminder ID is required' }, { status: 400 });
    }

    if (data.date) {
      data.date = new Date(data.date);
    }
    if (data.amount !== undefined) {
      data.amount = data.amount ? parseFloat(data.amount) : null;
    }

    const reminder = await reminderRepo.update(id, data);
    return NextResponse.json({ reminder });
  } catch (error) {
    console.error('Failed to update reminder:', error);
    return NextResponse.json({ error: 'Failed to update reminder' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Reminder ID is required' }, { status: 400 });
    }

    await reminderRepo.delete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete reminder:', error);
    return NextResponse.json({ error: 'Failed to delete reminder' }, { status: 500 });
  }
}
