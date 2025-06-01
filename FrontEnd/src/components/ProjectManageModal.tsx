import { useState, useEffect, useRef, useMemo } from 'react';
import { Plus, Edit, Trash2, Folder, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useProjectStore } from '@/stores/useProjectStore';
import { Project } from '@/types/schedule';
import { toast } from '@/hooks/use-toast';

interface ProjectManageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const COLOR_OPTIONS = [
  '#3b82f6', // 파랑
  '#10b981', // 초록
  '#8b5cf6', // 보라
  '#f59e0b', // 주황
  '#ef4444', // 빨강
  '#06b6d4', // 청록
  '#84cc16', // 라임
  '#f97316', // 오렌지
  '#ec4899', // 핑크
  '#6b7280', // 회색
];

export const ProjectManageModal = ({ isOpen, onClose }: ProjectManageModalProps) => {
  const {
    projects,
    isLoading,
    error,
    fetchProjects,
    addProject,
    updateProject,
    deleteProject
  } = useProjectStore();

  const [isAddMode, setIsAddMode] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: COLOR_OPTIONS[0]
  });

  // 모달이 열릴 때 데이터 로드 - useMemo로 처리
  useMemo(() => {
    if (isOpen && projects.length === 0 && !isLoading) {
      fetchProjects();
    }
  }, [isOpen, projects.length, isLoading]);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      color: COLOR_OPTIONS[0]
    });
    setIsAddMode(false);
    setEditingProject(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation(); // 이벤트 버블링 방지

    if (!formData.name.trim()) {
      toast({
        title: "오류",
        description: "프로젝트 이름을 입력해주세요.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      if (editingProject) {
        // 수정
        await updateProject(editingProject.id, formData);
        toast({
          title: "프로젝트가 수정되었습니다",
          description: `"${formData.name}" 프로젝트가 성공적으로 수정되었습니다.`,
        });
      } else {
        // 추가
        await addProject(formData);
        toast({
          title: "새 프로젝트가 추가되었습니다",
          description: `"${formData.name}" 프로젝트가 성공적으로 추가되었습니다.`,
        });
      }
      resetForm();
    } catch (error) {
      // 에러는 store에서 이미 처리되므로 여기서는 추가 처리 필요 없음
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (project: Project) => {
    setFormData({
      name: project.name,
      description: project.description || '',
      color: project.color
    });
    setEditingProject(project);
    setIsAddMode(true);
  };

  const handleDelete = async (project: Project) => {
    if (window.confirm(`"${project.name}" 프로젝트를 삭제하시겠습니까?\n\n이 프로젝트와 연결된 일정들은 프로젝트 연결이 해제됩니다.`)) {
      try {
        await deleteProject(project.id);
        toast({
          title: "프로젝트가 삭제되었습니다",
          description: `"${project.name}" 프로젝트가 삭제되었습니다.`,
        });
      } catch (error) {
        // 에러는 store에서 이미 처리됨
      }
    }
  };

  // 모달 닫기 핸들러 - onOpenChange에서 false가 전달되었을 때만 닫기
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetForm();
      onClose();
    }
  };

  // 버튼 클릭 핸들러들에 이벤트 버블링 방지 추가
  const handleAddClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsAddMode(true);
  };

  const handleCancelClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    resetForm();
  };

  const handleEditClick = (e: React.MouseEvent, project: Project) => {
    e.preventDefault();
    e.stopPropagation();
    handleEdit(project);
  };

  const handleDeleteClick = (e: React.MouseEvent, project: Project) => {
    e.preventDefault();
    e.stopPropagation();
    handleDelete(project);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto z-[60]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Folder size={20} />
            <span>프로젝트 관리</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* 에러 표시 */}
          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="py-4">
                <p className="text-red-600 text-sm">{error}</p>
              </CardContent>
            </Card>
          )}

          {/* 프로젝트 추가/수정 폼 */}
          {isAddMode ? (
            <Card>
              <CardHeader>
                <CardTitle>
                  {editingProject ? '프로젝트 수정' : '새 프로젝트 추가'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">프로젝트 이름 *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="프로젝트 이름을 입력하세요"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">설명</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="프로젝트 설명을 입력하세요"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>색상 *</Label>
                    <div className="flex flex-wrap gap-2">
                      {COLOR_OPTIONS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${formData.color === color ? 'border-gray-800 scale-110' : 'border-gray-300'
                            }`}
                          style={{ backgroundColor: color }}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setFormData(prev => ({ ...prev, color }));
                          }}
                          title={color}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancelClick}
                      disabled={isSubmitting}
                    >
                      취소
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {editingProject ? '수정하기' : '추가하기'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          ) : (
            <div className="flex justify-end">
              <Button onClick={handleAddClick} disabled={isLoading}>
                <Plus size={16} className="mr-2" />
                새 프로젝트 추가
              </Button>
            </div>
          )}

          {/* 기존 프로젝트 목록 */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">기존 프로젝트</h3>

            {isLoading ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <Loader2 className="mx-auto h-8 w-8 animate-spin text-gray-400 mb-4" />
                  <p className="text-gray-500">프로젝트를 불러오는 중...</p>
                </CardContent>
              </Card>
            ) : projects.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <Folder className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-500">아직 프로젝트가 없습니다.</p>
                  <p className="text-sm text-gray-400">새 프로젝트를 추가해보세요.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3">
                {projects.map((project) => (
                  <Card key={project.id} className="border-l-4 hover:bg-gray-50 transition-colors" style={{ borderLeftColor: project.color }}>
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: project.color }}
                          />
                          <div className="flex-1">
                            <h4 className="font-medium">{project.name}</h4>
                            {project.description && (
                              <p className="text-sm text-gray-600 mt-1">{project.description}</p>
                            )}
                            <div className="flex items-center space-x-2 mt-2">
                              <Badge variant="outline" className="text-xs">
                                생성: {new Date(project.createdAt).toLocaleDateString()}
                              </Badge>
                              {project.updatedAt !== project.createdAt && (
                                <Badge variant="outline" className="text-xs">
                                  수정: {new Date(project.updatedAt).toLocaleDateString()}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => handleEditClick(e, project)}
                            disabled={isLoading}
                          >
                            <Edit size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => handleDeleteClick(e, project)}
                            className="text-red-600 hover:text-red-700"
                            disabled={isLoading}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
