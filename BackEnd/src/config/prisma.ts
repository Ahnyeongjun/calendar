import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error'] : [],
});

async function testConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

async function seedDatabase(): Promise<void> {
  try {
    await seedUsers();
    await seedProjects();
  } catch (error) {
    console.error('Database seeding failed:', error);
    throw error;
  }
}

async function seedUsers(): Promise<void> {
  const users = [
    { id: '1', username: 'admin', name: '관리자' },
    { id: '2', username: 'admin2', name: '관리자2' }
  ];

  for (const user of users) {
    const exists = await prisma.user.findUnique({
      where: { username: user.username }
    });

    if (!exists) {
      await prisma.user.create({
        data: {
          ...user,
          password: await bcrypt.hash('1234', 10)
        }
      });
    }
  }
}

async function seedProjects(): Promise<void> {
  const projects = [
    { id: 'personal', name: '개인', description: '개인적인 일정', color: '#10b981' },
    { id: 'work', name: '업무', description: '회사 업무 관련', color: '#3b82f6' },
    { id: 'study', name: '학습', description: '공부 및 자기계발', color: '#8b5cf6' }
  ];

  for (const project of projects) {
    const exists = await prisma.project.findUnique({
      where: { id: project.id }
    });

    if (!exists) {
      await prisma.project.create({ data: project });
    }
  }
}

process.on('exit', () => {
  prisma.$disconnect();
});

export { prisma, testConnection, seedDatabase };
