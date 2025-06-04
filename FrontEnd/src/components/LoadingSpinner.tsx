import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8'
};

export const LoadingSpinner = ({ 
  text = '로딩 중...', 
  size = 'lg', 
  fullScreen = true 
}: LoadingSpinnerProps) => {
  const content = (
    <div className="flex flex-col items-center space-y-4">
      <Loader2 className={`${sizeClasses[size]} animate-spin text-blue-600`} />
      <p className="text-gray-600 font-medium">{text}</p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        {content}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-8">
      {content}
    </div>
  );
};
