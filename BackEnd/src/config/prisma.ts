import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { logger } from '../services/logger';
import { AppErrorType, classifyError, extractErrorMessage } from '../types/errors';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error'] : [],
});

async function testConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    logger.info('Database connection established successfully', 'DATABASE');
    return true;
  } catch (error: unknown) {
    const classifiedError = classifyError(error);
    const errorMessage = extractErrorMessage(classifiedError);

    logger.error('Database connection failed', 'DATABASE', {
      error: errorMessage,
      type: classifiedError.constructor.name
    });

    return false;
  }
}

async function seedDatabase(): Promise<void> {
  try {
    await seedUsers();
    await seedProjects();
    logger.info('Database seeding completed successfully', 'DATABASE');
  } catch (error: unknown) {
    const classifiedError = classifyError(error);
    const errorMessage = extractErrorMessage(classifiedError);

    logger.error('Database seeding failed', 'DATABASE', {
      error: errorMessage,
      type: classifiedError.constructor.name
    });

    throw new Error(`Database seeding failed: ${errorMessage}`);
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
      logger.debug(`User created: ${user.username}`, 'DATABASE');
    }
  }
}

async function seedProjects(): Promise<void> {
  const projects = [
    { id: 'personal', name: '개인', description: '개인적인 일정', color: '#10b981', userId: '1' },
    { id: 'work', name: '업무', description: '회사 업무 관련', color: '#3b82f6', userId: '1' },
    { id: 'study', name: '학습', description: '공부 및 자기계발', color: '#8b5cf6', userId: '1' }
  ];

  for (const project of projects) {
    const exists = await prisma.project.findUnique({
      where: { id: project.id }
    });

    if (!exists) {
      await prisma.project.create({ data: project });
      logger.debug(`Project created: ${project.name}`, 'DATABASE');
    }
  }
}

process.on('exit', () => {
  prisma.$disconnect();
});

export { prisma, testConnection, seedDatabase };
