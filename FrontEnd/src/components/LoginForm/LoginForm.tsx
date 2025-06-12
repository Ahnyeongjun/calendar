import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/stores/useAuthStore';
import { toast } from '@/hooks/use-toast';
import { LoginFormFields } from './LoginFormFields';
import { TestAccountInfo } from './TestAccountInfo';

const LoginForm = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const login = useAuthStore((state) => state.login);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim() || !password.trim()) {
      toast({
        title: "입력 오류",
        description: "아이디와 비밀번호를 모두 입력해주세요.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const success = await login({ username, password });

      if (success) {
        toast({
          title: "로그인 성공",
          description: "환영합니다!",
        });
      } else {
        toast({
          title: "로그인 실패",
          description: "아이디 또는 비밀번호가 올바르지 않습니다.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "로그인 오류",
        description: "서버 연결에 실패했습니다. 잠시 후 다시 시도해주세요.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">로그인</CardTitle>
          <CardDescription className="text-center">
            일정 관리 시스템에 로그인하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginFormFields
            username={username}
            password={password}
            onUsernameChange={setUsername}
            onPasswordChange={setPassword}
            onSubmit={handleSubmit}
            isLoading={isLoading}
          />
          <TestAccountInfo />
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginForm;
