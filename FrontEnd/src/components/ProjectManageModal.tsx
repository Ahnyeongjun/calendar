import { useState } from 'react';
import { Plus, Edit, Trash2, Folder } from 'lucide-react';
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
  const { projects, addProject, updateProject, deleteProject } = useProjectStore();
  const [isAddMode, setIsAddMode] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: COLOR_OPTIONS[0]
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      color: COLOR_OPTIONS[0]
    });
    setIsAddMode(false);
    setEditingProject(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "오류",
        description: "프로젝트 이름을 입력해주세요.",
        variant: "destructive"
      });
      return;
    }

    if (editingProject) {
      // 수정
      updateProject(editingProject.id, formData);
      toast({
        title: "프로젝트가 수정되었습니다",
        description: `"${formData.name}" 프로젝트가 성공적으로 수정되었습니다.`,
      });
    } else {
      // 추가
      addProject(formData);
      toast({
        title: "새 프로젝트가 추가되었습니다",
        description: `"${formData.name}" 프로젝트가 성공적으로 추가되었습니다.`,
      });
    }

    resetForm();
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

  const handleDelete = (project: Project) => {
    if (window.confirm(`"${project.name}" 프로젝트를 삭제하시겠습니까?`)) {
      deleteProject(project.id);
      toast({
        title: "프로젝트가 삭제되었습니다",
        description: `"${project.name}" 프로젝트가 삭제되었습니다.`,
      });
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Folder size={20} />
            <span>프로젝트 관리</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
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
                    <Label htmlFor="name">프로젝트 이름</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="프로젝트 이름을 입력하세요"
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
                    <Label>색상</Label>
                    <div className="flex flex-wrap gap-2">
                      {COLOR_OPTIONS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          className={`w-8 h-8 rounded-full border-2 ${
                            formData.color === color ? 'border-gray-800' : 'border-gray-300'
                          }`}
                          style={{ backgroundColor: color }}
                          onClick={() => setFormData(prev => ({ ...prev, color }))}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3">
                    <Button type="button" variant="outline" onClick={resetForm}>
                      취소
                    </Button>
                    <Button type="submit">
                      {editingProject ? '수정하기' : '추가하기'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          ) : (
            <div className="flex justify-end">
              <Button onClick={() => setIsAddMode(true)}>
                <Plus size={16} className="mr-2" />
                새 프로젝트 추가
              </Button>
            </div>
          )}

          {/* 기존 프로젝트 목록 */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">기존 프로젝트</h3>
            {projects.length === 0 ? (
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
                  <Card key={project.id} className="border-l-4" style={{ borderLeftColor: project.color }}>
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: project.color }}
                          />
                          <div>
                            <h4 className="font-medium">{project.name}</h4>
                            {project.description && (
                              <p className="text-sm text-gray-600">{project.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(project)}
                          >
                            <Edit size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(project)}
                            className="text-red-600 hover:text-red-700"
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
