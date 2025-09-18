import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import type { RegionalSale } from '../types';

interface RegionalSalesChartProps {
    data: RegionalSale[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 p-2 border border-gray-700 rounded-md shadow-lg">
          <p className="label text-white">{`${label}`}</p>
          <p className="intro text-cyan-400">{`Ventas : ${payload[0].value}`}</p>
        </div>
      );
    }
    return null;
};
  
const RegionalSalesChart: React.FC<RegionalSalesChartProps> = ({ data }) => {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    return (
        <div style={{ width: '100%', height: 250 }}>
            {isMounted && (
                <ResponsiveContainer>
                    <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(75, 85, 99, 0.3)'}}/>
                        <Bar dataKey="ventas" fill="#22d3ee" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            )}
        </div>
    );
};

export default RegionalSalesChart;