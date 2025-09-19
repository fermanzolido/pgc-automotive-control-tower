import React, { useMemo, useState } from 'react';
import type { Dealership, EnrichedSale, Vehicle, VehicleStatus, User } from '../types';
import { XIcon, CarIcon, WarehouseIcon, TruckIcon, CheckCircleIcon, UserCircleIcon, MailIcon, PhoneIcon, LocationMarkerIcon, ArrowRightIcon } from './icons/DashboardIcons';

interface DealershipDetailModalProps {
  dealership: Dealership;
  sales: EnrichedSale[];
  inventory: Vehicle[];
  onClose: () => void;
  currentUser: User;
  onInitiateTransfer: (vehicle: Vehicle) => void;
}

const statusStyles: Record<VehicleStatus, { text: string; bg: string; }> = {
  'In-Stock': { text: 'text-green-900', bg: 'bg-green-300' },
  'In-Transit': { text: 'text-yellow-900', bg: 'bg-yellow-300' },
  'Arrived': { text: 'text-purple-900', bg: 'bg-purple-300' },
  'Sold': { text: 'text-red-900', bg: 'bg-red-300' },
  'At-Factory': { text: 'text-blue-900', bg: 'bg-blue-300' },
  'Transferring': { text: 'text-gray-900', bg: 'bg-gray-300' },
};

const historyStatusConfig: Record<VehicleStatus, { icon: React.ReactNode; text: string; color: string; }> = {
    'At-Factory': { icon: <WarehouseIcon className="w-5 h-5" />, text: 'En Fábrica', color: 'text-blue-400' },
    'In-Transit': { icon: <TruckIcon className="w-5 h-5" />, text: 'En Tránsito', color: 'text-yellow-400' },
    'Arrived': { icon: <CheckCircleIcon className="w-5 h-5" />, text: 'Recibido', color: 'text-purple-400' },
    'In-Stock': { icon: <WarehouseIcon className="w-5 h-5" />, text: 'En Stock', color: 'text-green-400' },
    'Sold': { icon: <CheckCircleIcon className="w-5 h-5" />, text: 'Vendido', color: 'text-red-400' },
    'Transferring': { icon: <ArrowRightIcon className="w-5 h-5" />, text: 'En Transferencia', color: 'text-gray-400' },
};

const DealershipDetailModal: React.FC<DealershipDetailModalProps> = ({ dealership, sales, inventory, onClose, currentUser, onInitiateTransfer }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedVin, setExpandedVin] = useState<string | null>(null);
  const [expandedSaleId, setExpandedSaleId] = useState<string | null>(null);


  const dealershipSales = useMemo(() =>
    sales.filter(s => s.dealership.id === dealership.id)
         .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()),
    [sales, dealership.id]
  );

  const dealershipInventory = useMemo(() =>
    inventory.filter(v => v.dealershipId === dealership.id),
    [inventory, dealership.id]
  );
  
  const filteredInventory = useMemo(() =>
    dealershipInventory.filter(v => 
        v.vin.toLowerCase().includes(searchTerm.toLowerCase()) || 
        v.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.color.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [dealershipInventory, searchTerm]
  );

  const stockCount = dealershipInventory.filter(v => v.status === 'In-Stock').length;
  
  const getStatusText = (status: VehicleStatus) => {
    switch(status) {
        case 'In-Stock': return 'En Stock';
        case 'In-Transit': return 'En Tránsito';
        case 'Arrived': return 'Pendiente Aceptación';
        case 'Sold': return 'Vendido';
        case 'At-Factory': return 'En Fábrica';
        default: return status;
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col border border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header className="flex items-center justify-between p-4 border-b border-gray-700 flex-shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-cyan-400">{dealership.name}</h2>
            <p className="text-gray-400">{dealership.city}, {dealership.province}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-700 transition-colors">
            <XIcon className="w-6 h-6 text-gray-400" />
          </button>
        </header>

        {/* Content */}
        <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* KPIs */}
          <div className="md:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
              <div className="bg-gray-700/50 p-4 rounded-lg text-center">
                  <p className="text-sm text-gray-400">Vehículos en Stock</p>
                  <p className="text-3xl font-bold text-green-400">{stockCount}</p>
              </div>
              <div className="bg-gray-700/50 p-4 rounded-lg text-center">
                  <p className="text-sm text-gray-400">Ventas Totales</p>
                  <p className="text-3xl font-bold">{dealershipSales.length}</p>
              </div>
               <div className="bg-gray-700/50 p-4 rounded-lg text-center">
                  <p className="text-sm text-gray-400">Pendiente Aceptación</p>
                  <p className="text-3xl font-bold text-purple-400">{dealershipInventory.filter(v => v.status === 'Arrived').length}</p>
              </div>
               <div className="bg-gray-700/50 p-4 rounded-lg text-center">
                  <p className="text-sm text-gray-400">En Tránsito</p>
                  <p className="text-3xl font-bold text-yellow-400">{dealershipInventory.filter(v => v.status === 'In-Transit').length}</p>
              </div>
          </div>
          
          {/* Inventory */}
          <div className="md:col-span-2 bg-gray-900/50 p-4 rounded-lg flex flex-col">
            <h3 className="text-lg font-bold text-cyan-400 mb-3">Inventario Actual (Clic para ver historial)</h3>
            <input 
              type="text"
              placeholder="Buscar por Modelo, Color o VIN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 mb-3 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
            <div className="overflow-y-auto h-80 pr-2 flex-grow">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-400 uppercase bg-gray-700 sticky top-0">
                        <tr>
                            <th scope="col" className="px-4 py-2">Modelo</th>
                            <th scope="col" className="px-4 py-2">VIN</th>
                            <th scope="col" className="px-4 py-2">Estado</th>
                            <th scope="col" className="px-4 py-2 text-right">Acción</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredInventory.map(v => (
                            <React.Fragment key={v.vin}>
                                <tr 
                                    className="border-b border-gray-700 hover:bg-gray-700/50"
                                >
                                    <td className="px-4 py-2 font-medium cursor-pointer" onClick={() => setExpandedVin(expandedVin === v.vin ? null : v.vin)}>{v.model} <span className="text-gray-400 text-xs">({v.color})</span></td>
                                    <td className="px-4 py-2 text-gray-400 font-mono text-xs cursor-pointer" onClick={() => setExpandedVin(expandedVin === v.vin ? null : v.vin)}>{v.vin}</td>
                                    <td className="px-4 py-2 cursor-pointer" onClick={() => setExpandedVin(expandedVin === v.vin ? null : v.vin)}>
                                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${statusStyles[v.status]?.bg || 'bg-gray-500'} ${statusStyles[v.status]?.text || 'text-gray-100'}`}>
                                            {getStatusText(v.status)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2 text-right">
                                        {currentUser.role === 'DealershipAdmin' && currentUser.dealershipId !== dealership.id && v.status === 'In-Stock' && (
                                            <button
                                                onClick={() => onInitiateTransfer(v)}
                                                className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-1 px-2 rounded-lg text-xs transition-colors flex items-center"
                                            >
                                                <ArrowRightIcon className="w-4 h-4 mr-1"/>
                                                Solicitar
                                            </button>
                                        )}
                                    </td>
                                </tr>
                                {expandedVin === v.vin && (
                                    <tr className="bg-gray-900">
                                        <td colSpan={4} className="p-3">
                                            <h4 className="text-xs font-bold text-cyan-400 mb-2">Historial del Vehículo</h4>
                                            <ul className="space-y-2">
                                                {v.history.map((entry, index) => (
                                                    <li key={index} className="flex items-center space-x-3 text-xs">
                                                        <span className={historyStatusConfig[entry.status].color}>
                                                            {historyStatusConfig[entry.status].icon}
                                                        </span>
                                                        <span className={`font-semibold ${historyStatusConfig[entry.status].color} w-24`}>{historyStatusConfig[entry.status].text}</span>
                                                        <span className="text-gray-500">{entry.date.toLocaleString('es-AR')}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                         {filteredInventory.length === 0 && (
                            <tr>
                                <td colSpan={3} className="text-center py-8 text-gray-500">No se encontraron vehículos.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
          </div>

          {/* Recent Sales for dealership */}
          <div className="md:col-span-1 bg-gray-900/50 p-4 rounded-lg flex flex-col">
             <h3 className="text-lg font-bold text-cyan-400 mb-3">Últimas Ventas (clic para ver)</h3>
             <div className="overflow-y-auto h-80 pr-2 flex-grow">
                 <ul className="space-y-1">
                    {dealershipSales.slice(0, 15).map((sale) => (
                        <li key={sale.id}>
                            <div 
                                className="flex items-start space-x-3 p-2 rounded-md hover:bg-gray-700/50 cursor-pointer"
                                onClick={() => setExpandedSaleId(expandedSaleId === sale.id ? null : sale.id)}
                            >
                                <div className="p-1.5 bg-gray-600 rounded-full mt-1 flex-shrink-0"><CarIcon /></div>
                                <div className="flex-grow">
                                    <p className="font-semibold text-white text-sm">{sale.vehicle.model}</p>
                                    <p className="text-xs text-gray-400">
                                        Vendido por {sale.salesperson.name}
                                    </p>
                                     <p className="text-xs text-cyan-400 font-bold">${sale.salePrice.toLocaleString('es-AR')}</p>
                                    <p className="text-xs text-gray-500">
                                    {sale.timestamp.toLocaleDateString('es-AR')}
                                    </p>
                                </div>
                            </div>
                            {expandedSaleId === sale.id && (
                                <div className="bg-gray-900/75 p-3 ml-6 rounded-b-md space-y-2 text-xs">
                                    <div className="flex items-center space-x-2">
                                        <UserCircleIcon className="w-4 h-4 text-gray-400" />
                                        <span>{sale.customerFirstName} {sale.customerLastName}</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <MailIcon className="w-4 h-4 text-gray-400" />
                                        <a href={`mailto:${sale.customerEmail}`} className="text-cyan-400 hover:underline">{sale.customerEmail}</a>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <PhoneIcon className="w-4 h-4 text-gray-400" />
                                        <span>{sale.customerPhone}</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <LocationMarkerIcon className="w-4 h-4 text-gray-400" />
                                        <span>{sale.customerAddress}</span>
                                    </div>
                                </div>
                            )}
                        </li>
                    ))}
                     {dealershipSales.length === 0 && (
                        <li className="text-center py-8 text-gray-500 text-sm">Sin ventas recientes.</li>
                    )}
                 </ul>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default DealershipDetailModal;