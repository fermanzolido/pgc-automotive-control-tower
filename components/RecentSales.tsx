
import React from 'react';
import type { EnrichedSale } from '../types';
import { CarIcon } from './icons/DashboardIcons';

interface RecentSalesProps {
  sales: EnrichedSale[];
}

const RecentSales: React.FC<RecentSalesProps> = ({ sales }) => {
  return (
    <div>
      <h2 className="text-xl font-bold mb-4 text-cyan-400">Actividad en Tiempo Real</h2>
      <div className="overflow-y-auto h-64 pr-2">
        <ul>
          {sales.map((sale, index) => (
            <li
              key={sale.id}
              className={`flex items-center space-x-4 p-3 rounded-md ${index % 2 === 0 ? 'bg-gray-700/50' : ''}`}
            >
              <div className="p-2 bg-gray-600 rounded-full"><CarIcon /></div>
              <div className="flex-grow">
                <p className="font-semibold text-white">
                  {sale.vehicle.model} vendido en {sale.dealership.city}
                </p>
                <p className="text-sm text-gray-400">
                  Por {sale.salesperson.name} - Venta: ${sale.salePrice.toLocaleString('es-AR')}
                </p>
                <p className="text-sm text-green-400 font-semibold">
                  Ganancia: ${sale.profit.toLocaleString('es-AR')}
                </p>
              </div>
              <p className="text-sm text-gray-500">
                {sale.timestamp.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </li>
          ))}
          {sales.length === 0 && (
            <li className="text-center py-8 text-gray-500 text-sm">Sin actividad de ventas.</li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default RecentSales;