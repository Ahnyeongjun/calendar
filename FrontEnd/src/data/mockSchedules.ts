import { Schedule } from '@/types/schedule';

export const mockSchedules: Schedule[] = [
  {
    id: '1',
    title: '팀 미팅',
    description: '월간 팀 회의',
    date: new Date(2025, 4, 28), // May 28, 2025 (today)
    startTime: '10:00',
    endTime: '11:30',
    category: 'meeting',
    priority: 'high',
    status: 'planned',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '2',
    title: '프로젝트 검토',
    description: 'Q2 프로젝트 진행상황 검토',
    date: new Date(2025, 4, 28),
    startTime: '14:00',
    endTime: '15:30',
    category: 'work',
    priority: 'medium',
    status: 'in-progress',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '3',
    title: '점심 약속',
    description: '동료와 점심 미팅',
    date: new Date(2025, 4, 28),
    startTime: '12:00',
    endTime: '13:00',
    category: 'personal',
    priority: 'low',
    status: 'planned',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '4',
    title: '운동',
    description: '헬스장 운동',
    date: new Date(2025, 4, 29),
    startTime: '18:00',
    endTime: '19:30',
    category: 'personal',
    priority: 'medium',
    status: 'planned',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '5',
    title: '클라이언트 미팅',
    description: '새 프로젝트 논의',
    date: new Date(2025, 4, 30),
    startTime: '15:00',
    endTime: '16:30',
    category: 'meeting',
    priority: 'high',
    status: 'planned',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '6',
    title: '완료된 작업',
    description: '이미 완료된 작업',
    date: new Date(2025, 4, 27),
    startTime: '09:00',
    endTime: '10:00',
    category: 'work',
    priority: 'medium',
    status: 'completed',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];
