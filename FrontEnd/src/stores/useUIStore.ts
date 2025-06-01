import { create } from 'zustand';

interface UIState {
  // 모달 상태들
  isProjectManageModalOpen: boolean;
  isScheduleModalOpen: boolean;
  
  // 보호 모드 (페치 중에는 모달 닫기 방지)
  isProjectFetching: boolean;
  
  // 모달 제어 액션들
  openProjectManageModal: () => void;
  closeProjectManageModal: () => void;
  setProjectFetching: (fetching: boolean) => void;
  openScheduleModal: () => void;
  closeScheduleModal: () => void;
  
  // 기타 UI 상태들 (필요시 추가)
  currentView: 'calendar' | 'table';
  setCurrentView: (view: 'calendar' | 'table') => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  // 초기 상태
  isProjectManageModalOpen: false,
  isScheduleModalOpen: false,
  isProjectFetching: false,
  currentView: 'calendar',
  
  // 프로젝트 관리 모달 액션들
  openProjectManageModal: () => {
    console.log('🟢 Zustand: 프로젝트 관리 모달 열기');
    console.trace('openProjectManageModal 호출 스택:');
    set({ isProjectManageModalOpen: true });
  },
  
  closeProjectManageModal: () => {
    const { isProjectFetching } = get();
    if (isProjectFetching) {
      console.log('🔴 Zustand: 프로젝트 페치 중이므로 모달 닫기 무시!');
      return; // 페치 중이면 닫지 않음
    }
    console.log('🔴 Zustand: 프로젝트 관리 모달 닫기');
    console.trace('closeProjectManageModal 호출 스택:');
    set({ isProjectManageModalOpen: false });
  },
  
  setProjectFetching: (fetching) => {
    console.log('🔄 Zustand: 프로젝트 페치 상태:', fetching);
    set({ isProjectFetching: fetching });
  },
  
  // 일정 모달 액션들
  openScheduleModal: () => {
    console.log('🟢 Zustand: 일정 모달 열기');
    set({ isScheduleModalOpen: true });
  },
  
  closeScheduleModal: () => {
    console.log('🔴 Zustand: 일정 모달 닫기');
    set({ isScheduleModalOpen: false });
  },
  
  // 뷰 변경
  setCurrentView: (view) => {
    console.log('🔄 Zustand: 뷰 변경:', view);
    set({ currentView: view });
  },
}));
