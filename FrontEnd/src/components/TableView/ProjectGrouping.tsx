import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FolderOpen, Calendar } from 'lucide-react';
import { Schedule } from '@/types/schedule';
import { useProject } from '@/hooks/useProject';
import { ScheduleTableRow } from './ScheduleTableRow';

interface ProjectGroupingProps {
  schedules: Schedule[];
  onScheduleClick: (schedule: Schedule) => void;
  onStatusChange: (id: string, status: 'planned' | 'in_progress' | 'completed') => Promise<void>;
  onDeleteSchedule: (id: string) => Promise<void>;
}

export const ProjectGrouping = ({ 
  schedules, 
  onScheduleClick, 
  onStatusChange, 
  onDeleteSchedule 
}: ProjectGroupingProps) => {
  const { projects, getProject } = useProject();

  // 프로젝트별로 일정을 그룹핑
  const groupedSchedules = schedules.reduce((groups, schedule) => {
    const projectId = schedule.projectId || 'none';
    if (!groups[projectId]) {
      groups[projectId] = [];
    }
    groups[projectId].push(schedule);
    return groups;
  }, {} as Record<string, Schedule[]>);

  // 프로젝트 순서 정렬 (프로젝트 있는 것 먼저, 없는 것 마지막)
  const sortedProjectIds = Object.keys(groupedSchedules).sort((a, b) => {
    if (a === 'none') return 1;
    if (b === 'none') return -1;
    
    const projectA = getProject(a);
    const projectB = getProject(b);
    return (projectA?.name || '').localeCompare(projectB?.name || '');
  });

  return (
    <div className="space-y-6">
      {sortedProjectIds.map((projectId) => {
        const project = projectId === 'none' ? null : getProject(projectId);
        const projectSchedules = groupedSchedules[projectId];
        const completedCount = projectSchedules.filter(s => s.status === 'completed').length;
        const totalCount = projectSchedules.length;

        return (
          <Card key={projectId} className="overflow-hidden shadow-sm">
            {/* 프로젝트 헤더 */}
            <div 
              className="px-6 py-4 border-l-4"
              style={{ 
                borderLeftColor: project?.color || '#6b7280',
                backgroundColor: (project?.color || '#6b7280') + '08'
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {project ? (
                    <>
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: project.color }}
                      />
                      <div>
                        <h3 className="text-lg font-semibold">{project.name}</h3>
                        {project.description && (
                          <p className="text-sm text-gray-600">{project.description}</p>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <FolderOpen className="w-4 h-4 text-gray-400" />
                      <div>
                        <h3 className="text-lg font-semibold text-gray-600">프로젝트 없음</h3>
                        <p className="text-sm text-gray-500">특정 프로젝트에 속하지 않은 일정</p>
                      </div>
                    </>
                  )}
                </div>
                
                <div className="flex items-center space-x-4">
                  <Badge variant="outline" className="flex items-center space-x-1">
                    <Calendar className="w-3 h-3" />
                    <span>{totalCount}개 일정</span>
                  </Badge>
                  
                  <div className="text-sm text-gray-600">
                    완료: {completedCount}/{totalCount} 
                    ({totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0}%)
                  </div>
                  
                  {/* 진행률 바 */}
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full transition-all"
                      style={{ 
                        width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%`,
                        backgroundColor: project?.color || '#6b7280'
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 일정 테이블 */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      상태
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      제목
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      날짜
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      시간
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      우선순위
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      액션
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {projectSchedules.map((schedule) => (
                    <ScheduleTableRow
                      key={schedule.id}
                      schedule={schedule}
                      onScheduleClick={onScheduleClick}
                      onStatusChange={onStatusChange}
                      onDeleteSchedule={onDeleteSchedule}
                      hideProject={true} // 프로젝트 컬럼 숨김
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        );
      })}
    </div>
  );
};
