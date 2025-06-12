import { Schedule } from '@/types/schedule';

export const mockSchedules: Schedule[] = [
  {
    id: '1',
    title: '팀 미팅',
    description: '월간 팀 회의',
    date: new Date(2025, 4, 28).toISOString(), // May 28, 2025 (today)
    priority: 'high',
    status: 'planned',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    userId: '',
  },
  {
    id: '2',
    title: '프로젝트 검토',
    description: 'Q2 프로젝트 진행상황 검토',
    date: new Date(2025, 4, 28).toISOString(),
    userId: '',
    priority: 'medium',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'planned'
  },
  {
    id: '3',
    title: '점심 약속',
    description: '동료와 점심 미팅',
    date: new Date(2025, 4, 28).toISOString(),
    userId: '',
    priority: 'low',
    status: 'planned',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '4',
    title: '운동',
    description: '헬스장 운동',
    date: new Date(2025, 4, 29).toISOString(),
    userId: '',
    priority: 'medium',
    status: 'planned',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '5',
    title: '클라이언트 미팅',
    description: '새 프로젝트 논의',
    date: new Date(2025, 4, 30).toISOString(),
    priority: 'high',
    status: 'planned',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    userId: ''
  },
  {
    id: '6',
    title: '완료된 작업',
    description: '이미 완료된 작업',
    date: new Date(2025, 4, 27).toISOString(),
    priority: 'medium',
    status: 'completed',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    userId: ''
  }
];
