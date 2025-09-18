
import React, { useState } from 'react';
import type { Dealership, ReportOptions } from '../types';
import { XIcon, DocumentDownloadIcon } from './icons/DashboardIcons';


interface ReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    dealerships: Dealership[];
    onGenerateReport: (options: ReportOptions) => void;
}

const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose, dealerships, onGenerateReport }) => {
    const [selectedDealerships, setSelectedDealerships] = useState<Set<string>>(new Set());
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [isDetailed, setIsDetailed] = useState(false);
    
    const handleDealershipChange = (dealershipId: string) => {
        setSelectedDealerships(prev => {
            const newSet = new Set(prev);
            if (newSet.has(dealershipId)) {
                newSet.delete(dealershipId);
            } else {
                newSet.add(dealershipId);
            }
            return newSet;
        });
    };

    const handleSelectAll = () => {
        if (selectedDealerships.size === dealerships.length) {
            setSelectedDealerships(new Set());
        } else {
            setSelectedDealerships(new Set(dealerships.map(d => d.id)));
        }
    };

    const handleSubmit = () => {
        onGenerateReport({
            dealershipIds: Array.from(selectedDealerships),
            startDate,
            endDate,
            detailed: isDetailed,
        });
    };
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div 
                className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-gray-700"
                onClick={(e) => e.stopPropagation()}
            >
                <header className="flex items-center justify-between p-4 border-b border-gray-700">
                    <div>
                        <h2 className="text-2xl font-bold text-cyan-400">Generador de Reportes</h2>
                        <p className="text-gray-400 text-sm">Seleccione los filtros para exportar los datos en formato CSV.</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-700 transition-colors">
                        <XIcon className="w-6 h-6 text-gray-400" />
                    </button>
                </header>

                <div className="p-6 space-y-6 overflow-y-auto">
                    {/* Dealership Filter */}
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-2">1. Filtrar por Concesionario</h3>
                        <p className="text-xs text-gray-400 mb-3">Deje en blanco para incluir todos los concesionarios.</p>
                        <div className="bg-gray-900/50 p-3 rounded-lg max-h-48 overflow-y-auto">
                            <div className="flex items-center mb-2">
                                <input 
                                    type="checkbox" 
                                    id="select-all" 
                                    checked={selectedDealerships.size === dealerships.length && dealerships.length > 0} 
                                    onChange={handleSelectAll}
                                    className="w-4 h-4 text-cyan-600 bg-gray-700 border-gray-600 rounded focus:ring-cyan-500"
                                />
                                <label htmlFor="select-all" className="ml-2 text-sm font-medium text-gray-300">Seleccionar Todos</label>
                            </div>
                            <hr className="border-gray-700 mb-2"/>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {dealerships.map(d => (
                                    <div key={d.id} className="flex items-center p-1 rounded hover:bg-gray-700/50">
                                        <input 
                                            type="checkbox" 
                                            id={`d-${d.id}`} 
                                            checked={selectedDealerships.has(d.id)} 
                                            onChange={() => handleDealershipChange(d.id)}
                                            className="w-4 h-4 text-cyan-600 bg-gray-700 border-gray-600 rounded focus:ring-cyan-500"
                                        />
                                        <label htmlFor={`d-${d.id}`} className="ml-2 text-sm text-gray-300 cursor-pointer flex-grow">{d.name}</label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Date Filter */}
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-2">2. Filtrar Ventas por Fecha</h3>
                        <p className="text-xs text-gray-400 mb-3">Deje en blanco para incluir todo el historial.</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="start-date" className="block text-sm font-medium text-gray-300">Fecha de Inicio</label>
                                <input type="date" id="start-date" value={startDate} onChange={e => setStartDate(e.target.value)} className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm p-2 text-gray-200" />
                            </div>
                             <div>
                                <label htmlFor="end-date" className="block text-sm font-medium text-gray-300">Fecha de Fin</label>
                                <input type="date" id="end-date" value={endDate} onChange={e => setEndDate(e.target.value)} className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm p-2 text-gray-200" />
                            </div>
                        </div>
                    </div>

                    {/* Report Type */}
                     <div>
                        <h3 className="text-lg font-semibold text-white mb-2">3. Seleccionar Tipo de Reporte</h3>
                         <div className="flex items-start bg-gray-900/50 p-3 rounded-lg">
                            <div className="flex items-center h-5">
                                <input 
                                    id="detailed-report" 
                                    type="checkbox" 
                                    checked={isDetailed} 
                                    onChange={e => setIsDetailed(e.target.checked)}
                                    className="focus:ring-cyan-500 h-4 w-4 text-cyan-600 border-gray-600 rounded"
                                />
                            </div>
                            <div className="ml-3 text-sm">
                                <label htmlFor="detailed-report" className="font-medium text-gray-300">Incluir información detallada de clientes y vehículos</label>
                                <p className="text-gray-500">Genera un reporte completo con una fila por vehículo. Si no se marca, se generará un reporte resumido de stock y ventas por modelo.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <footer className="p-4 border-t border-gray-700 flex justify-end bg-gray-800 rounded-b-lg">
                    <button 
                        onClick={handleSubmit} 
                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg transition-colors flex items-center space-x-2"
                    >
                       <DocumentDownloadIcon className="w-5 h-5 text-white" />
                       <span>Generar y Descargar CSV</span>
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default ReportModal;