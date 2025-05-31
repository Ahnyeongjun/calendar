// Day Header Component
export const DayHeaders = () => {
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  
  return (
    <div className="grid grid-cols-7 gap-0 border-b">
      {days.map((day, index) => (
        <div
          key={day}
          className={`p-4 text-center font-medium text-gray-600 bg-gray-50 border-r last:border-r-0 ${
            index === 0 ? 'text-red-600' : index === 6 ? 'text-blue-600' : ''
          }`}
        >
          {day}
        </div>
      ))}
    </div>
  );
};
