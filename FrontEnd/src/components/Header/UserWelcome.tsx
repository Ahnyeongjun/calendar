import { useAuthStore } from '@/stores/useAuthStore';

export const UserWelcome = () => {
  const user = useAuthStore((state) => state.user);

  if (!user) return null;

  return (
    <span className="text-sm text-gray-600">
      안녕하세요, {user.name}님
    </span>
  );
};
