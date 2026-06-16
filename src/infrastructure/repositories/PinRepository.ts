import prisma from '../database/PrismaClient';

export async function getPin(): Promise<string | null> {
  const pin = await prisma.userPin.findFirst();
  return pin?.hash || null;
}

export async function setPin(hash: string): Promise<void> {
  await prisma.userPin.upsert({
    where: { id: 'pin' },
    update: { hash },
    create: { id: 'pin', hash },
  });
}

export async function verifyPin(input: string, stored: string): Promise<boolean> {
  try {
    const bcrypt = await import('bcryptjs');
    return bcrypt.compare(input, stored);
  } catch {
    return false;
  }
}

export async function hasPin(): Promise<boolean> {
  const pin = await getPin();
  return pin !== null;
}

export async function clearPin(): Promise<void> {
  await prisma.userPin.deleteMany();
}
