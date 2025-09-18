import React, { useState, useMemo } from 'react';
import type { EnrichedSale, Dealership, RegionalSale, Vehicle, User, Goal, TransferRequest, DemandForecast } from '../types';
import TransferManagement from './TransferManagement';
import KpiCard from './KpiCard';
import RecentSales from './RecentSales';
import RegionalSalesChart from './RegionalSalesChart';
import TopPerformers from './TopPerformers';
import MapChart from './MapChart';
import DealershipDetailModal from './DealershipDetailModal';
import { DollarSignIcon, CarIcon, TrendingUpIcon, UsersIcon, WarehouseIcon, ZapIcon, PercentIcon } from './icons/DashboardIcons';
import AI_Assistant from './AI_Assistant';

interface DashboardProps {
    currentUser: User;
    sales: EnrichedSale[];
    vehicles: Vehicle[];
    dealerships: Dealership[];
    users: User[];
    regionalSales: RegionalSale[];
    financialKpis: {
        totalRevenue: number;
        totalProfit: number;
        totalCommissions: number;
        averageMargin: number;
    };
    topSalespeople: any[];
    topDealerships: any[];
    transferRequests: TransferRequest[];
    onInitiateSale: (vehicle: Vehicle) => void;
    onAcceptDelivery: (vin: string) => void;
    onInitiateTransfer: (vehicle: Vehicle) => void;
    onApproveTransfer: (transferId: string) => void;
    onRejectTransfer: (transferId: string) => void;
    demandForecasts: DemandForecast[];
}

const Dashboard: React.FC<DashboardProps> = ({
    currentUser,
    sales,
    vehicles,
    dealerships,
    users,
    regionalSales,
    financialKpis,
    topSalespeople,
    topDealerships,
    transferRequests,
    demandForecasts,
    onInitiateSale,
    onAcceptDelivery,
    onInitiateTransfer,
    onApproveTransfer,
    onRejectTransfer,
}) => {
    const [activeDealership, setActiveDealership] = useState<Dealership | null>(null);
    const [selectedDealership, setSelectedDealership] = useState<Dealership | null>(null);
    const [viewMode, setViewMode] = useState<'dashboard' | 'transfers'>('dashboard');

    const isFactoryUser = currentUser.role === 'Factory';
    const isDealershipUser = currentUser.role === 'DealershipAdmin' || currentUser.role === 'Salesperson';

    const displayedSales = useMemo(() => {
        if (isFactoryUser) return sales;
        if (isDealershipUser) return sales.filter(s => s.dealership.id === currentUser.dealershipId);
        return [];
    }, [sales, currentUser, isFactoryUser, isDealershipUser]);

    const displayedVehicles = useMemo(() => {
        if (isFactoryUser) return vehicles;
        if (isDealershipUser) return vehicles.filter(v => v.dealershipId === currentUser.dealershipId);
        return [];
    }, [vehicles, currentUser, isFactoryUser, isDealershipUser]);

    const dealershipInStockVehicles = useMemo(() => {
        if (!isDealershipUser) return [];
        return displayedVehicles.filter(v => v.status === 'In-Stock');
    }, [displayedVehicles, isDealershipUser]);

    const dealershipArrivedVehicles = useMemo(() => {
        if (!isDealershipUser) return [];
        return displayedVehicles.filter(v => v.status === 'Arrived');
    }, [displayedVehicles, isDealershipUser]);

    const kpis = useMemo(() => {
        const totalSales = displayedSales.reduce((sum, sale) => sum + sale.salePrice, 0);
        const totalVehiclesSold = displayedSales.length;
        const modelCounts = displayedSales.reduce((acc, sale) => {
            acc[sale.vehicle.model] = (acc[sale.vehicle.model] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        const topSellingModel = Object.entries(modelCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
        const inStockCount = displayedVehicles.filter(v => v.status === 'In-Stock').length;

        return { totalSales, totalVehicles: totalVehiclesSold, topSellingModel, dealershipsActive: dealerships.length, inStockCount };
    }, [displayedSales, displayedVehicles, dealerships.length]);

    if (!kpis) {
        return <div className="flex justify-center items-center h-screen"><div className="text-xl">Cargando Torre de Control...</div></div>;
    }
    
    return (
        <>
            {currentUser.role === 'DealershipAdmin' && (
                <div className="mb-6 flex space-x-1 rounded-lg bg-gray-700 p-1">
                    <button
                        onClick={() => setViewMode('dashboard')}
                        className={`w-full rounded-md py-2 text-sm font-medium transition-colors ${
                            viewMode === 'dashboard' ? 'bg-cyan-600 text-white shadow' : 'text-gray-300 hover:bg-gray-600'
                        }`}
                    >
                        Dashboard Principal
                    </button>
                    <button
                        onClick={() => setViewMode('transfers')}
                        className={`w-full rounded-md py-2 text-sm font-medium transition-colors ${
                            viewMode === 'transfers' ? 'bg-cyan-600 text-white shadow' : 'text-gray-300 hover:bg-gray-600'
                        }`}
                    >
                        Gestionar Transferencias
                    </button>
                </div>
            )}

            {viewMode === 'transfers' && currentUser.role === 'DealershipAdmin' ? (
                <TransferManagement
                    currentUser={currentUser}
                    transferRequests={transferRequests}
                    allDealerships={dealerships}
                    onApprove={onApproveTransfer}
                    onReject={onRejectTransfer}
                />
            ) : (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <KpiCard title={isFactoryUser ? "Ingresos Totales (Red)" : "Ingresos Totales (Local)"} value={`$${financialKpis.totalRevenue.toLocaleString('es-AR')}`} icon={<DollarSignIcon />} trend={`$${kpis.totalSales.toLocaleString('es-AR')} en ventas`}/>
                        <KpiCard title={isFactoryUser ? "Ganancia Neta (Red)" : "Ganancia Neta (Local)"} value={`$${financialKpis.totalProfit.toLocaleString('es-AR')}`} icon={<ZapIcon />} trend={`$${financialKpis.totalCommissions.toLocaleString('es-AR')} en comisiones`} />
                        <KpiCard title="Margen de Ganancia" value={`${financialKpis.averageMargin.toFixed(2)}%`} icon={<PercentIcon />} trend="Promedio de la red" />
                        <KpiCard title="Vehículos Vendidos" value={kpis.totalVehicles.toString()} icon={<CarIcon />} trend="Unidades facturadas"/>
                    </div>

                    <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {isFactoryUser ? (
                            <>
                                <div className="lg:col-span-2 bg-gray-800 p-6 rounded-lg shadow-lg flex flex-col min-h-[300px] max-h-[500px]">
                                    <h2 className="text-xl font-bold mb-1 text-cyan-400">Mapa de Operaciones</h2>
                            <p className="text-sm text-gray-400 mb-4">Haz clic en un concesionario para ver detalles.</p>
                            <div className="flex-grow relative">
                                <MapChart 
                                    dealerships={dealerships} 
                                    sales={sales}
                                    onDealershipClick={setSelectedDealership}
                                />
                            </div>
                        </div>
                        <div className="space-y-6">
                            <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                                <RecentSales sales={displayedSales} />
                            </div>
                            <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                                <h2 className="text-xl font-bold mb-4 text-cyan-400">Ventas por Región</h2>
                                <RegionalSalesChart data={regionalSales} />
                            </div>
                        </div>
                        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                                <TopPerformers title="Mejores Vendedores (por Ganancia)" data={topSalespeople} subKey="dealership" valuePrefix="$" goalType="profit" />
                            </div>
                            <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                                <TopPerformers 
                                    title="Concesionarios Top (por Ganancia)" 
                                    data={topDealerships} 
                                    subKey="location" 
                                    onItemClick={(item) => setSelectedDealership(item as Dealership)}
                                    valuePrefix="$"
                                    goalType="profit"
                                />
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                       {dealershipArrivedVehicles.length > 0 && (
                             <div className="lg:col-span-3 bg-gray-800 p-6 rounded-lg shadow-lg border border-yellow-500/50">
                                <h2 className="text-xl font-bold mb-4 text-yellow-400">Entregas Pendientes de Aceptación ({dealershipArrivedVehicles.length} unidades)</h2>
                                <div className="overflow-y-auto max-h-64 pr-2">
                                    <table className="w-full text-sm text-left">
                                        <thead className="text-xs text-gray-400 uppercase bg-gray-700 sticky top-0">
                                            <tr>
                                                <th scope="col" className="px-4 py-3">Modelo</th>
                                                <th scope="col" className="px-4 py-3">VIN</th>
                                                <th scope="col" className="px-4 py-3 hidden sm:table-cell">Llegada</th>
                                                <th scope="col" className="px-4 py-3 text-right">Acción</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {dealershipArrivedVehicles.map(v => (
                                                <tr key={v.vin} className="border-b border-gray-700 hover:bg-gray-700/50">
                                                    <td className="px-4 py-3 font-medium">{v.model} <span className="text-gray-400">({v.color})</span></td>
                                                    <td className="px-4 py-3 font-mono text-xs text-gray-400">{v.vin}</td>
                                                    <td className="px-4 py-3 hidden sm:table-cell text-gray-400">{v.history.find(h => h.status === 'Arrived')?.date.toLocaleDateString('es-AR')}</td>
                                                    <td className="px-4 py-3 text-right">
                                                        <button
                                                            onClick={() => onAcceptDelivery(v.vin)}
                                                            className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-1 px-3 rounded-lg text-xs transition-colors"
                                                        >
                                                            Aceptar
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                       )}

                        <div className="lg:col-span-3 bg-gray-800 p-6 rounded-lg shadow-lg">
                            <h2 className="text-xl font-bold mb-4 text-cyan-400">Inventario en Stock ({dealershipInStockVehicles.length} unidades)</h2>
                            <div className="overflow-y-auto max-h-96 pr-2">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-gray-400 uppercase bg-gray-700 sticky top-0">
                                        <tr>
                                            <th scope="col" className="px-4 py-3">Modelo</th>
                                            <th scope="col" className="px-4 py-3">Color</th>
                                            <th scope="col" className="px-4 py-3 hidden sm:table-cell">Año</th>
                                            <th scope="col" className="px-4 py-3">VIN</th>
                                            <th scope="col" className="px-4 py-3 text-right">Acción</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {dealershipInStockVehicles.map(v => (
                                            <tr key={v.vin} className="border-b border-gray-700 hover:bg-gray-700/50">
                                                <td className="px-4 py-3 font-medium">{v.model}</td>
                                                <td className="px-4 py-3">{v.color}</td>
                                                <td className="px-4 py-3 hidden sm:table-cell">{v.year}</td>
                                                <td className="px-4 py-3 font-mono text-xs text-gray-400">{v.vin}</td>
                                                <td className="px-4 py-3 text-right">
                                                    <button 
                                                        onClick={() => onInitiateSale(v)}
                                                        className="bg-green-500 hover:bg-green-600 text-white font-bold py-1 px-3 rounded-lg text-xs transition-colors"
                                                    >
                                                        Vender
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {dealershipInStockVehicles.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="text-center py-8 text-gray-500">No hay vehículos en stock.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="lg:col-span-2 bg-gray-800 p-6 rounded-lg shadow-lg">
                            <RecentSales sales={displayedSales} />
                        </div>
                        <div className="lg:col-span-1 bg-gray-800 p-6 rounded-lg shadow-lg">
                            <TopPerformers title="Vendedores del Concesionario" data={topSalespeople} subKey="dealership" valuePrefix="$" goalType="profit" />
                        </div>
                    </>
                )}
            </div>

            {selectedDealership && (
                <DealershipDetailModal
                    dealership={selectedDealership}
                    sales={sales}
                    inventory={vehicles}
                    onClose={() => setSelectedDealership(null)}
                    currentUser={currentUser}
                    onInitiateTransfer={onInitiateTransfer}
                />
            )}
            
            {isFactoryUser && <AI_Assistant sales={sales} vehicles={vehicles} dealerships={dealerships} salespeople={users.filter(u => u.role === 'Salesperson')} demandForecasts={demandForecasts} />}
                </>
            )}
        </>
    );
};

export default Dashboard;