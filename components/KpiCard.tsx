
import React from 'react';

interface KpiCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend: string;
}

const KpiCard: React.FC<KpiCardProps> = ({ title, value, icon, trend }) => {
  return (
    <div className="bg-gray-800 p-5 rounded-lg shadow-lg flex items-center space-x-4 transition-transform transform hover:scale-105 hover:bg-gray-700">
      <div className="p-3 bg-gray-900 rounded-full">
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-400">{title}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className={`text-xs ${trend.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
          {trend}
        </p>
      </div>
    </div>
  );
};

export default KpiCard;
