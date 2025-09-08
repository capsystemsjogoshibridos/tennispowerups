
import React from 'react';

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  unit: string;
  colorClass: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, title, value, unit, colorClass }) => {
  return (
    <div className={`bg-gray-800 p-4 rounded-xl shadow-lg flex items-center space-x-4 ${colorClass}`}>
      <div className="text-3xl">
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-400 font-medium uppercase tracking-wider">{title}</p>
        <p className="text-2xl font-bold">
          {value} <span className="text-lg font-normal text-gray-300">{unit}</span>
        </p>
      </div>
    </div>
  );
};

export default StatCard;
