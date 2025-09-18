import React, { useState, useMemo } from 'react';
import type { Dealership, Vehicle, User, Goal } from '../types';
import { XIcon } from './icons/DashboardIcons';

interface ManagementModalProps {
    isOpen: boolean;
    onClose: () => void;
    dealerships: Dealership[];
    vehicles: Vehicle[];
    users: User[];
    goals: Goal[];
    onAddDealership: (dealership: Omit<Dealership, 'id' | 'coords'>) => void;
    onRemoveDealership: (dealershipId: string) => void;
    onAddVehicle: (vehicle: { vin: string; model: string; color: string; year: number; costPrice: number }) => void;
    onBulkAssignVehicles: (vins: string[], dealershipId: string) => void;
    onCreateUser: (user: Omit<User, 'id'>) => void;
    onDeleteUser: (userId: string) => void;
    onSetGoal: (goal: Omit<Goal, 'id'>) => void;
}

type ActiveTab = 'dealerships' | 'vehicles' | 'users' | 'goals';

const ManagementModal: React.FC<ManagementModalProps> = ({
    isOpen, onClose, dealerships, vehicles, users, goals,
    onAddDealership, onRemoveDealership, onAddVehicle, onBulkAssignVehicles, onCreateUser, onDeleteUser, onSetGoal
}) => {
    const [activeTab, setActiveTab] = useState<ActiveTab>('dealerships');

    // Forms State
    const [newDealershipName, setNewDealershipName] = useState('');
    const [newDealershipCity, setNewDealershipCity] = useState('');
    const [newDealershipProvince, setNewDealershipProvince] = useState('');
    const [newVehicleVin, setNewVehicleVin] = useState('');
    const [newVehicleModel, setNewVehicleModel] = useState('');
    const [newVehicleColor, setNewVehicleColor] = useState('');
    const [newVehicleYear, setNewVehicleYear] = useState(new Date().getFullYear().toString());
    const [newVehicleFactoryPrice, setNewVehicleFactoryPrice] = useState('');
    const [newAdminUsername, setNewAdminUsername] = useState('');
    const [newAdminPassword, setNewAdminPassword] = useState('');
    const [newAdminName, setNewAdminName] = useState('');
    const [assignedDealershipId, setAssignedDealershipId] = useState('');

    // Bulk Assignment State
    const [modelFilter, setModelFilter] = useState('');
    const [colorFilter, setColorFilter] = useState('');
    const [yearFilter, setYearFilter] = useState('');
    const [selectedVins, setSelectedVins] = useState<Set<string>>(new Set());
    const [targetDealership, setTargetDealership] = useState('');
    const [quantity, setQuantity] = useState(1);

    // Goal state
    const [selectedDealership, setSelectedDealership] = useState('');
    const [goalMonth, setGoalMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
    const [goalType, setGoalType] = useState<'salesCount' | 'profit'>('salesCount');
    const [goalTarget, setGoalTarget] = useState('');

    const factoryVehicles = useMemo(() => vehicles.filter(v => v.status === 'At-Factory'), [vehicles]);
    const dealershipAdmins = useMemo(() => users.filter(u => u.role === 'DealershipAdmin'), [users]);

    const handleAddDealershipSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onAddDealership({ name: newDealershipName, city: newDealershipCity, province: newDealershipProvince });
        setNewDealershipName(''); setNewDealershipCity(''); setNewDealershipProvince('');
    };
    
    const handleAddVehicleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onAddVehicle({ vin: newVehicleVin, model: newVehicleModel, color: newVehicleColor, year: parseInt(newVehicleYear, 10), costPrice: parseFloat(newVehicleFactoryPrice) });
        setNewVehicleVin(''); setNewVehicleModel(''); setNewVehicleColor(''); setNewVehicleYear(new Date().getFullYear().toString()); setNewVehicleFactoryPrice('');
    };
    
    const handleAddAdminSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newAdminUsername || !newAdminPassword || !newAdminName || !assignedDealershipId) {
            alert('Por favor, complete todos los campos para el nuevo administrador.');
            return;
        }
        onCreateUser({
            username: newAdminUsername,
            password: newAdminPassword,
            name: newAdminName,
            role: 'DealershipAdmin',
            dealershipId: assignedDealershipId
        });
        setNewAdminUsername(''); setNewAdminPassword(''); setNewAdminName(''); setAssignedDealershipId('');
    };

    const handleSetGoalSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedDealership || !goalMonth || !goalTarget) {
            alert('Por favor, complete todos los campos para la meta.');
            return;
        }
        onSetGoal({
            entityId: selectedDealership,
            month: goalMonth,
            type: goalType,
            target: parseFloat(goalTarget)
        });
        alert(`Meta establecida para ${dealerships.find(d => d.id === selectedDealership)?.name || 'Concesionario'}`)
        setGoalTarget('');
    };

    const handleBulkAssign = () => {
        if (!targetDealership || selectedVins.size === 0) return;
        const vinsToAssign = Array.from(selectedVins).slice(0, quantity);
        onBulkAssignVehicles(vinsToAssign, targetDealership);
        setSelectedVins(new Set()); setTargetDealership(''); setQuantity(1);
    };

     const filteredVehicles = useMemo(() => {
        return factoryVehicles.filter(v => 
            (modelFilter ? v.model === modelFilter : true) &&
            (colorFilter ? v.color === colorFilter : true) &&
            (yearFilter ? v.year.toString() === yearFilter : true)
        );
    }, [factoryVehicles, modelFilter, colorFilter, yearFilter]);

    const filterOptions = useMemo(() => {
        const models = [...new Set(factoryVehicles.map(v => v.model))];
        const colors = [...new Set(factoryVehicles.map(v => v.color))];
        const years = [...new Set(factoryVehicles.map(v => v.year.toString()))];
        return { models, colors, years };
    }, [factoryVehicles]);

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedVins(e.target.checked ? new Set(filteredVehicles.map(v => v.vin)) : new Set());
    };

    const handleSelectOne = (vin: string) => {
        setSelectedVins(prev => {
            const newSet = new Set(prev);
            newSet.has(vin) ? newSet.delete(vin) : newSet.add(vin);
            return newSet;
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col border border-gray-700" onClick={(e) => e.stopPropagation()}>
                <header className="flex items-center justify-between p-4 border-b border-gray-700 flex-shrink-0">
                    <h2 className="text-2xl font-bold text-cyan-400">Panel de Gestión de Red</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-700"><XIcon className="w-6 h-6 text-gray-400" /></button>
                </header>
                <div className="flex border-b border-gray-700 px-6">
                    <button onClick={() => setActiveTab('dealerships')} className={`py-3 px-4 font-semibold text-sm ${activeTab === 'dealerships' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-gray-400 hover:text-white'}`}>Concesionarios</button>
                    <button onClick={() => setActiveTab('vehicles')} className={`py-3 px-4 font-semibold text-sm ${activeTab === 'vehicles' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-gray-400 hover:text-white'}`}>Vehículos</button>
                    <button onClick={() => setActiveTab('users')} className={`py-3 px-4 font-semibold text-sm ${activeTab === 'users' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-gray-400 hover:text-white'}`}>Usuarios</button>
                    <button onClick={() => setActiveTab('goals')} className={`py-3 px-4 font-semibold text-sm ${activeTab === 'goals' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-gray-400 hover:text-white'}`}>Metas</button>
                </div>
                <div className="p-6 overflow-y-auto flex-grow">
                    {activeTab === 'dealerships' && (
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="md:col-span-1 bg-gray-900/50 p-6 rounded-lg">
                                <h3 className="text-lg font-bold text-cyan-400 mb-4">Añadir Concesionario</h3>
                                <form onSubmit={handleAddDealershipSubmit} className="space-y-4">
                                    <input type="text" value={newDealershipName} onChange={e => setNewDealershipName(e.target.value)} placeholder="Nombre" className="w-full bg-gray-700 rounded-md p-2 text-sm" required/>
                                    <input type="text" value={newDealershipCity} onChange={e => setNewDealershipCity(e.target.value)} placeholder="Ciudad" className="w-full bg-gray-700 rounded-md p-2 text-sm" required/>
                                    <input type="text" value={newDealershipProvince} onChange={e => setNewDealershipProvince(e.target.value)} placeholder="Provincia" className="w-full bg-gray-700 rounded-md p-2 text-sm" required/>
                                    <button type="submit" className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 rounded-lg">Añadir</button>
                                </form>
                            </div>
                            <div className="md:col-span-2 bg-gray-900/50 p-6 rounded-lg">
                                <h3 className="text-lg font-bold text-cyan-400 mb-4">Lista ({dealerships.length})</h3>
                                <ul className="space-y-2 h-96 overflow-y-auto pr-2">
                                    {dealerships.map(d => (
                                        <li key={d.id} className="flex justify-between items-center bg-gray-700/50 p-3 rounded-md">
                                            <div><p className="font-semibold">{d.name}</p><p className="text-xs text-gray-400">{d.city}, {d.province}</p></div>
                                            <button onClick={() => onRemoveDealership(d.id)} className="text-red-400 hover:text-red-300 text-xs font-semibold">ELIMINAR</button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}
                    {activeTab === 'vehicles' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
                            <div className="md:col-span-1 bg-gray-900/50 p-6 rounded-lg flex flex-col">
                                <h3 className="text-lg font-bold text-cyan-400 mb-4">Crear Vehículo</h3>
                                <form onSubmit={handleAddVehicleSubmit} className="space-y-4">
                                     <input type="text" value={newVehicleVin} onChange={e => setNewVehicleVin(e.target.value)} placeholder="VIN (único)" className="w-full bg-gray-700 rounded-md p-2 text-sm" required />
                                     <input type="text" value={newVehicleModel} onChange={e => setNewVehicleModel(e.target.value)} placeholder="Modelo" className="w-full bg-gray-700 rounded-md p-2 text-sm" required />
                                     <input type="text" value={newVehicleColor} onChange={e => setNewVehicleColor(e.target.value)} placeholder="Color" className="w-full bg-gray-700 rounded-md p-2 text-sm" required />
                                     <input type="number" value={newVehicleYear} onChange={e => setNewVehicleYear(e.target.value)} placeholder="Año" className="w-full bg-gray-700 rounded-md p-2 text-sm" required />
                                     <input type="number" value={newVehicleFactoryPrice} onChange={e => setNewVehicleFactoryPrice(e.target.value)} placeholder="Costo de Fábrica (USD)" className="w-full bg-gray-700 rounded-md p-2 text-sm" required />
                                    <button type="submit" className="w-full bg-cyan-500 hover:bg-cyan-600 font-bold py-2 rounded-lg">Crear</button>
                                </form>
                                <hr className="my-6 border-gray-700" />
                                <h3 className="text-lg font-bold text-cyan-400 mb-4">Asignación de Lotes</h3>
                                <div className="space-y-4">
                                    <p className="text-sm font-semibold">{selectedVins.size} vehículos seleccionados</p>
                                    <input type="number" value={quantity} onChange={e => setQuantity(Math.max(1, Math.min(selectedVins.size, parseInt(e.target.value) || 1)))} min="1" max={selectedVins.size} className="w-full bg-gray-700 rounded-md p-2 text-sm" />
                                    <select value={targetDealership} onChange={e => setTargetDealership(e.target.value)} className="w-full bg-gray-700 rounded-md p-2 text-sm">
                                        <option value="" disabled>Seleccionar Destino...</option>
                                        {dealerships.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                    </select>
                                    <button onClick={handleBulkAssign} disabled={!targetDealership || selectedVins.size === 0} className="w-full bg-green-600 hover:bg-green-700 font-bold py-2 rounded-lg disabled:bg-gray-600">Asignar</button>
                                </div>
                            </div>
                            <div className="md:col-span-2 bg-gray-900/50 p-6 rounded-lg flex flex-col">
                                <h3 className="text-lg font-bold text-cyan-400 mb-4">Inventario en Fábrica ({factoryVehicles.length})</h3>
                                <div className="flex gap-4 mb-4 text-sm">
                                    <select value={modelFilter} onChange={e => setModelFilter(e.target.value)} className="bg-gray-700 rounded p-1"><option value="">Modelo</option>{filterOptions.models.map(o => <option key={o} value={o}>{o}</option>)}</select>
                                    <select value={colorFilter} onChange={e => setColorFilter(e.target.value)} className="bg-gray-700 rounded p-1"><option value="">Color</option>{filterOptions.colors.map(o => <option key={o} value={o}>{o}</option>)}</select>
                                    <select value={yearFilter} onChange={e => setYearFilter(e.target.value)} className="bg-gray-700 rounded p-1"><option value="">Año</option>{filterOptions.years.map(o => <option key={o} value={o}>{o}</option>)}</select>
                                </div>
                                <div className="flex-grow overflow-y-auto pr-2">
                                    <table className="w-full text-sm text-left">
                                        <thead className="text-xs text-gray-400 uppercase bg-gray-700 sticky top-0">
                                            <tr>
                                                <th className="px-4 py-2 w-10"><input type="checkbox" onChange={handleSelectAll} checked={filteredVehicles.length > 0 && selectedVins.size === filteredVehicles.length} /></th>
                                                <th className="px-4 py-2">Modelo</th><th className="px-4 py-2">Color</th><th className="px-4 py-2">Año</th><th className="px-4 py-2">VIN</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                        {filteredVehicles.map(v => (
                                            <tr key={v.vin} className={`border-b border-gray-700 ${selectedVins.has(v.vin) ? 'bg-cyan-900/50' : ''}`}>
                                                <td className="px-4 py-2"><input type="checkbox" checked={selectedVins.has(v.vin)} onChange={() => handleSelectOne(v.vin)} /></td>
                                                <td className="px-4 py-2 font-semibold">{v.model}</td><td>{v.color}</td><td>{v.year}</td><td className="font-mono text-xs text-gray-400">{v.vin}</td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                    {activeTab === 'users' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="md:col-span-1 bg-gray-900/50 p-6 rounded-lg">
                                <h3 className="text-lg font-bold text-cyan-400 mb-4">Crear Administrador de Concesionario</h3>
                                <form onSubmit={handleAddAdminSubmit} className="space-y-4">
                                    <input type="text" value={newAdminName} onChange={e => setNewAdminName(e.target.value)} placeholder="Nombre Completo" className="w-full bg-gray-700 rounded-md p-2 text-sm" required />
                                    <select value={assignedDealershipId} onChange={e => setAssignedDealershipId(e.target.value)} className="w-full bg-gray-700 rounded-md p-2 text-sm" required>
                                        <option value="" disabled>Asignar a Concesionario...</option>
                                        {dealerships.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                    </select>
                                    <input type="text" value={newAdminUsername} onChange={e => setNewAdminUsername(e.target.value)} placeholder="Nombre de Usuario" className="w-full bg-gray-700 rounded-md p-2 text-sm" required />
                                    <input type="password" value={newAdminPassword} onChange={e => setNewAdminPassword(e.target.value)} placeholder="Contraseña" className="w-full bg-gray-700 rounded-md p-2 text-sm" required />
                                    <button type="submit" className="w-full bg-cyan-500 hover:bg-cyan-600 font-bold py-2 rounded-lg">Crear Administrador</button>
                                </form>
                            </div>
                            <div className="md:col-span-2 bg-gray-900/50 p-6 rounded-lg">
                                <h3 className="text-lg font-bold text-cyan-400 mb-4">Administradores Activos ({dealershipAdmins.length})</h3>
                                <ul className="space-y-2 h-96 overflow-y-auto pr-2">
                                    {dealershipAdmins.map(u => (
                                        <li key={u.id} className="flex justify-between items-center bg-gray-700/50 p-3 rounded-md">
                                            <div>
                                                <p className="font-semibold">{u.name} <span className="text-xs font-mono text-gray-400">({u.username})</span></p>
                                                <p className="text-xs text-cyan-400">{dealerships.find(d=>d.id===u.dealershipId)?.name || 'Sin Asignar'}</p>
                                            </div>
                                            <button onClick={() => onDeleteUser(u.id)} className="text-red-400 hover:text-red-300 text-xs font-semibold">ELIMINAR</button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}
                    {activeTab === 'goals' && (
                        <div className="p-6 overflow-y-auto">
                            <div className="md:col-span-1 bg-gray-900/50 p-6 rounded-lg max-w-md mx-auto">
                                <h3 className="text-lg font-bold text-cyan-400 mb-4">Establecer Meta Mensual para Concesionario</h3>
                                <form onSubmit={handleSetGoalSubmit} className="space-y-4">
                                    <select value={selectedDealership} onChange={e => setSelectedDealership(e.target.value)} className="w-full bg-gray-700 rounded-md p-2 text-sm" required>
                                        <option value="" disabled>Seleccionar Concesionario...</option>
                                        {dealerships.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                    </select>
                                    <input type="month" value={goalMonth} onChange={e => setGoalMonth(e.target.value)} className="w-full bg-gray-700 rounded-md p-2 text-sm" required />
                                    <select value={goalType} onChange={e => setGoalType(e.target.value as any)} className="w-full bg-gray-700 rounded-md p-2 text-sm" required>
                                        <option value="salesCount">Nº de Ventas</option>
                                        <option value="profit">Ganancia Generada</option>
                                    </select>
                                    <input type="number" value={goalTarget} onChange={e => setGoalTarget(e.target.value)} placeholder="Objetivo (ej: 100 o 500000)" className="w-full bg-gray-700 rounded-md p-2 text-sm" required />
                                    <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg">Establecer Meta</button>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ManagementModal;