import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface LoginFormFieldsProps {
  username: string;
  password: string;
  onUsernameChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const LoginFormFields = ({
  username,
  password,
  onUsernameChange,
  onPasswordChange,
  onSubmit
}: LoginFormFieldsProps) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="username">아이디</Label>
        <Input
          id="username"
          type="text"
          value={username}
          onChange={(e) => onUsernameChange(e.target.value)}
          placeholder="admin 또는 admin2"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">비밀번호</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
          placeholder="1234"
          required
        />
      </div>
      <Button type="submit" className="w-full">
        로그인
      </Button>
    </form>
  );
};
