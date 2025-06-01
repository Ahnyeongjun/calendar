import { useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { AuthLayout } from "@/components/AuthLayout";
import { useAuthStore } from "@/stores/useAuthStore";
import MyPage from "./pages/MyPage";
import LoginPage from "./pages/LoginPage";
import MainPage from "./pages/MainPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// 내부 라우터 컴포넌트
const AppRoutes = () => {
  const navigate = useNavigate();
  const { setNavigate, initializeAuth } = useAuthStore();

  // Store에 navigate 함수 등록 및 인증 초기화
  useEffect(() => {
    setNavigate(navigate);
    initializeAuth();
  }, [navigate, setNavigate, initializeAuth]);

  return (
    <AuthLayout>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/mypage" element={<MyPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthLayout>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
