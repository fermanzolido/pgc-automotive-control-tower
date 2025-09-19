import React from 'react';

interface Performer {
    id: number | string;
    name: string;
    value: number; // Represents profit
    salesCount: number;
    profitGoal?: number;
    salesCountGoal?: number;
    city?: string; // Add optional city
    province?: string; // Add optional province
    coords?: { x: number; y: number }; // Add optional coords
    [key: string]: any;
}

interface TopPerformersProps<T extends Performer> {
    title: string;
    data: T[];
    subKey: string;
    onItemClick?: (item: T) => void;
    valuePrefix?: string;
    valueSuffix?: string;
    goalType: 'salesCount' | 'profit';
}

const TopPerformers = <T extends Performer>({ title, data, subKey, onItemClick, valuePrefix = '', valueSuffix = '', goalType }: TopPerformersProps<T>) => {
    const maxValue = data.length > 0 ? Math.max(...data.map(d => goalType === 'profit' ? d.value : d.salesCount)) : 1;

    return (
        <div>
            <h3 className="text-xl font-bold mb-4 text-cyan-400">{title}</h3>
            <ul className="space-y-4">
                {data.map((item, index) => {
                    const itemValue = goalType === 'profit' ? item.value : item.salesCount;
                    const itemGoal = goalType === 'profit' ? item.profitGoal : item.salesCountGoal;
                    const progress = itemGoal && itemGoal > 0 ? (itemValue / itemGoal) * 100 : 0;
                    const displaySuffix = goalType === 'salesCount' ? ' ventas' : valueSuffix;

                    return (
                        <li 
                            key={item.id} 
                            className={`flex items-center space-x-4 p-3 rounded-lg transition-colors bg-gray-800/50 ${onItemClick ? 'cursor-pointer hover:bg-gray-700/50' : ''}`}
                            onClick={() => onItemClick && onItemClick(item)}
                        >
                            <span className="font-bold text-gray-400 text-lg w-6 text-center">{index + 1}</span>
                            <div className="flex-grow">
                                <div className="flex justify-between items-baseline">
                                    <p className="text-white font-semibold">{item.name}</p>
                                    <p className="text-sm font-bold text-cyan-300">{valuePrefix}{itemValue.toLocaleString('es-AR')}{displaySuffix}</p>
                                </div>
                                <div className="w-full bg-gray-700 rounded-full h-2.5 mt-1">
                                    <div
                                        className="bg-cyan-500 h-2.5 rounded-full"
                                        style={{ width: `${(itemValue / maxValue) * 100}%` }}
                                    ></div>
                                </div>
                                {itemGoal != null && (
                                    <div className="mt-2">
                                        <div className="flex justify-between items-baseline text-xs">
                                            <p className="text-gray-400">Meta: {valuePrefix}{itemGoal.toLocaleString('es-AR')}{displaySuffix}</p>
                                            <p className={`font-semibold ${progress >= 100 ? 'text-green-400' : 'text-yellow-400'}`}>{progress.toFixed(0)}%</p>
                                        </div>
                                        <div className="w-full bg-gray-600 rounded-full h-1.5 mt-1">
                                            <div
                                                className={`h-1.5 rounded-full ${progress >= 100 ? 'bg-green-500' : 'bg-yellow-500'}`}
                                                style={{ width: `${Math.min(progress, 100)}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                )}
                                 <p className="text-xs text-gray-500 mt-1.5">{item[subKey]}</p>
                            </div>
                        </li>
                    )
                })}
                 {data.length === 0 && (
                    <li className="text-center py-8 text-gray-500 text-sm">No hay datos de rendimiento.</li>
                )}
            </ul>
        </div>
    );
};

export default TopPerformers;
