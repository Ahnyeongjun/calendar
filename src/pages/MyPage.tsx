import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/stores/useAuthStore';
import { User, Calendar, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

const MyPage = () => {
  const { user, logout } = useAuthStore();

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              마이페이지
            </h1>
            <Link to="/">
              <Button variant="outline">
                <Calendar className="mr-2 h-4 w-4" />
                일정 관리로 돌아가기
              </Button>
            </Link>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="mr-2 h-5 w-5" />
                  사용자 정보
                </CardTitle>
                <CardDescription>
                  현재 로그인된 계정 정보입니다
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="font-medium">이름:</span>
                    <span>{user.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">아이디:</span>
                    <span>{user.username}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">사용자 ID:</span>
                    <span className="text-gray-500">{user.id}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="mr-2 h-5 w-5" />
                  계정 설정
                </CardTitle>
                <CardDescription>
                  계정 관련 설정을 관리할 수 있습니다
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={logout}
                  variant="destructive"
                  className="w-full"
                >
                  로그아웃
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyPage;
