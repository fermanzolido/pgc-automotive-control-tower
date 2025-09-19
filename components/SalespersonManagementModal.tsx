
import React, { useState, useMemo } from 'react';
import type { User, Goal } from '../types';
import { XIcon } from './icons/DashboardIcons';

interface SalespersonManagementModalProps {
    isOpen: boolean;
    onClose: () => void;
    users: User[];
    currentUser: User;
    goals: Goal[]; // Add goals
    onCreateUser: (user: Omit<User, 'id'>) => void;
    onDeleteUser: (userId: string) => void;
    onSetGoal: (goal: Omit<Goal, 'id'>) => void; // Add onSetGoal
}

type ActiveTab = 'create' | 'goals'; // Define the type for activeTab
const SalespersonManagementModal: React.FC<SalespersonManagementModalProps> = ({
    isOpen, onClose, users, currentUser, onCreateUser, onDeleteUser, goals, onSetGoal
}) => {
    const [activeTab, setActiveTab] = useState<ActiveTab>('create'); // Declare activeTab
    const [newUsername, setNewUsername] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newName, setNewName] = useState('');

    // Declare states for goal management
    const [selectedSalesperson, setSelectedSalesperson] = useState('');
    const [goalMonth, setGoalMonth] = useState('');
    const [goalType, setGoalType] = useState<'salesCount' | 'profit'>('salesCount'); // Default to salesCount
    const [goalTarget, setGoalTarget] = useState('');

    const salespeople = useMemo(() => 
        users.filter(u => u.role === 'Salesperson' && u.dealershipId === currentUser.dealershipId),
    [users, currentUser.dealershipId]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newUsername || !newPassword || !newName) {
            alert('Por favor, complete todos los campos.');
            return;
        }
        onCreateUser({
            username: newUsername,
            password: newPassword,
            name: newName,
            role: 'Salesperson',
            dealershipId: currentUser.dealershipId
        });
        setNewUsername('');
        setNewPassword('');
        setNewName('');
    };

    const handleSetGoalSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSalesperson || !goalMonth || !goalTarget) {
            alert('Por favor, complete todos los campos para la meta.');
            return;
        }
        onSetGoal({
            entityId: selectedSalesperson,
            month: goalMonth,
            type: goalType,
            target: parseFloat(goalTarget)
        });
        alert(`Meta establecida para ${users.find(u => u.id === selectedSalesperson)?.name || 'Vendedor'}`)
        setGoalTarget('');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div 
                className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-gray-700"
                onClick={(e) => e.stopPropagation()}
            >
                <header className="flex items-center justify-between p-4 border-b border-gray-700">
                    <div>
                        <h2 className="text-2xl font-bold text-cyan-400">Gestionar Vendedores</h2>
                        <p className="text-gray-400 text-sm">Cree y administre las cuentas de su equipo de ventas.</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-700 transition-colors">
                        <XIcon className="w-6 h-6 text-gray-400" />
                    </button>
                </header>

                <div className="flex border-b border-gray-700 px-6">
                    <button onClick={() => setActiveTab('create')} className={`py-3 px-4 font-semibold text-sm ${activeTab === 'create' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-gray-400 hover:text-white'}`}>Gestionar Vendedores</button>
                    <button onClick={() => setActiveTab('goals')} className={`py-3 px-4 font-semibold text-sm ${activeTab === 'goals' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-gray-400 hover:text-white'}`}>Establecer Metas</button>
                </div>

                {activeTab === 'create' && (
                    <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-1 bg-gray-900/50 p-6 rounded-lg">
                            <h3 className="text-lg font-bold text-cyan-400 mb-4">Crear Vendedor</h3>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="Nombre Completo" className="w-full bg-gray-700 rounded-md p-2 text-sm" required />
                                <input type="text" value={newUsername} onChange={e => setNewUsername(e.target.value)} placeholder="Nombre de Usuario" className="w-full bg-gray-700 rounded-md p-2 text-sm" required />
                                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Contraseña" className="w-full bg-gray-700 rounded-md p-2 text-sm" required />
                                <button type="submit" className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 rounded-lg">Crear Usuario</button>
                            </form>
                        </div>
                        <div className="md:col-span-2 bg-gray-900/50 p-6 rounded-lg">
                            <h3 className="text-lg font-bold text-cyan-400 mb-4">Vendedores Activos ({salespeople.length})</h3>
                            <ul className="space-y-2 h-96 overflow-y-auto pr-2">
                                {salespeople.map(u => (
                                    <li key={u.id} className="flex justify-between items-center bg-gray-700/50 p-3 rounded-md">
                                        <div>
                                            <p className="font-semibold">{u.name}</p>
                                            <p className="text-xs font-mono text-gray-400">{u.username}</p>
                                        </div>
                                        <button onClick={() => onDeleteUser(u.id)} className="text-red-400 hover:text-red-300 text-xs font-semibold">ELIMINAR</button>
                                    </li>
                                ))}
                                {salespeople.length === 0 && (
                                    <li className="text-center py-8 text-gray-500 text-sm">No hay vendedores creados.</li>
                                )}
                            </ul>
                        </div>
                    </div>
                )}

                {activeTab === 'goals' && (
                     <div className="p-6 overflow-y-auto">
                        <div className="md:col-span-1 bg-gray-900/50 p-6 rounded-lg max-w-md mx-auto">
                            <h3 className="text-lg font-bold text-cyan-400 mb-4">Establecer Meta Mensual</h3>
                            <form onSubmit={handleSetGoalSubmit} className="space-y-4">
                                <select value={selectedSalesperson} onChange={e => setSelectedSalesperson(e.target.value)} className="w-full bg-gray-700 rounded-md p-2 text-sm" required>
                                    <option value="" disabled>Seleccionar Vendedor...</option>
                                    {salespeople.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                                <input type="month" value={goalMonth} onChange={e => setGoalMonth(e.target.value)} className="w-full bg-gray-700 rounded-md p-2 text-sm" required />
                                <select value={goalType} onChange={e => setGoalType(e.target.value as any)} className="w-full bg-gray-700 rounded-md p-2 text-sm" required>
                                    <option value="salesCount">Nº de Ventas</option>
                                    <option value="profit">Ganancia Generada</option>
                                </select>
                                <input type="number" value={goalTarget} onChange={e => setGoalTarget(e.target.value)} placeholder="Objetivo (ej: 10 o 50000)" className="w-full bg-gray-700 rounded-md p-2 text-sm" required />
                                <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg">Establecer Meta</button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SalespersonManagementModal;