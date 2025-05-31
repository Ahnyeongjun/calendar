import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

// PrismaClient 인스턴스 생성
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

// 데이터베이스 연결 테스트
async function testConnection(): Promise<boolean> {
  try {
    // 데이터베이스 연결 테스트 (간단한 쿼리 실행)
    await prisma.$queryRaw`SELECT 1`;
    console.log('Prisma database connection established successfully');
    return true;
  } catch (error) {
    console.error('Prisma database connection failed:', error);
    return false;
  }
}

// 초기 데이터 설정
async function seedDatabase(): Promise<void> {
  try {
    // 기본 사용자 생성 (없는 경우에만)
    const adminExists = await prisma.user.findUnique({
      where: { username: 'admin' }
    });

    const admin2Exists = await prisma.user.findUnique({
      where: { username: 'admin2' }
    });

    if (!adminExists) {
      await prisma.user.create({
        data: {
          id: '1',
          username: 'admin',
          password: await import('bcrypt').then(bcrypt => bcrypt.hash('1234', 10)),
          name: '관리자'
        }
      });
      console.log('Admin user created');
    }

    if (!admin2Exists) {
      await prisma.user.create({
        data: {
          id: '2',
          username: 'admin2',
          password: await import('bcrypt').then(bcrypt => bcrypt.hash('1234', 10)),
          name: '관리자2'
        }
      });
      console.log('Admin2 user created');
    }

    // 기본 프로젝트 생성 (없는 경우에만)
    const defaultProjects = [
      {
        id: 'personal',
        name: '개인',
        description: '개인적인 일정 및 할일',
        color: '#10b981'
      },
      {
        id: 'work',
        name: '업무',
        description: '회사 업무 관련',
        color: '#3b82f6'
      },
      {
        id: 'study',
        name: '학습',
        description: '공부 및 자기계발',
        color: '#8b5cf6'
      }
    ];

    for (const project of defaultProjects) {
      const existingProject = await prisma.project.findUnique({
        where: { id: project.id }
      });

      if (!existingProject) {
        await prisma.project.create({
          data: project
        });
        console.log(`Project '${project.name}' created`);
      }
    }

    console.log('Database seeding completed successfully');
  } catch (error) {
    console.error('Database seeding failed:', error);
    throw error;
  }
}

// 애플리케이션 종료 시 Prisma 연결 종료
process.on('exit', () => {
  prisma.$disconnect();
});

export {
  prisma,
  testConnection,
  seedDatabase
};
