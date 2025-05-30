// Style utility functions
export const getCategoryColor = (category: string) => {
  const colors = {
    work: 'bg-blue-100 text-blue-800 border-blue-200',
    personal: 'bg-green-100 text-green-800 border-green-200',
    meeting: 'bg-purple-100 text-purple-800 border-purple-200',
    other: 'bg-gray-100 text-gray-800 border-gray-200'
  };
  return colors[category as keyof typeof colors] || colors.other;
};

export const getStatusOpacity = (status: string) => {
  switch (status) {
    case 'completed':
      return 'opacity-60';
    case 'in-progress':
      return 'opacity-90';
    default:
      return 'opacity-100';
  }
};

export const getPriorityIndicator = (priority: string) => {
  switch (priority) {
    case 'high':
      return 'border-l-4 border-red-500';
    case 'medium':
      return 'border-l-4 border-yellow-500';
    case 'low':
      return 'border-l-4 border-green-500';
    default:
      return '';
  }
};
