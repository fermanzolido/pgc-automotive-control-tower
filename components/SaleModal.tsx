import React, { useState } from 'react';
import type { Vehicle, Sale } from '../types';
import { XIcon } from './icons/DashboardIcons';

interface SaleModalProps {
    vehicle: Vehicle;
    onClose: () => void;
    onCreateSale: (
        vehicle: Vehicle,
        customerData: Omit<Sale, 'id' | 'timestamp' | 'vehicleId' | 'salespersonId' | 'dealershipId'>
    ) => void;
}

const SaleModal: React.FC<SaleModalProps> = ({ vehicle, onClose, onCreateSale }) => {
    const [customerFirstName, setCustomerFirstName] = useState('');
    const [customerLastName, setCustomerLastName] = useState('');
    const [customerEmail, setCustomerEmail] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [customerAddress, setCustomerAddress] = useState('');
    const [salePrice, setSalePrice] = useState('');
    const [financingIncome, setFinancingIncome] = useState(''); // Add this line
    const [insuranceIncome, setInsuranceIncome] = useState(''); // Add this line

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!customerFirstName || !customerLastName || !customerEmail || !customerPhone || !customerAddress || !salePrice) {
            alert('Por favor complete todos los campos.');
            return;
        }

        onCreateSale(vehicle, {
            customerFirstName,
            customerLastName,
            customerEmail,
            customerPhone,
            customerAddress,
            salePrice: parseFloat(salePrice),
            financingIncome: parseFloat(financingIncome || '0'), // Add this line
            insuranceIncome: parseFloat(insuranceIncome || '0'), // Add this line
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div 
                className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-lg flex flex-col border border-gray-700"
                onClick={(e) => e.stopPropagation()}
            >
                <header className="flex items-center justify-between p-4 border-b border-gray-700">
                    <div>
                        <h2 className="text-xl font-bold text-cyan-400">Registrar Venta</h2>
                        <p className="text-gray-400 text-sm">Vehículo: {vehicle.model} ({vehicle.vin})</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-700 transition-colors">
                        <XIcon className="w-6 h-6 text-gray-400" />
                    </button>
                </header>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <h3 className="text-lg font-semibold text-white">Datos del Cliente</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input type="text" value={customerFirstName} onChange={e => setCustomerFirstName(e.target.value)} placeholder="Nombre" className="w-full bg-gray-700 rounded-md p-2 text-sm" required />
                        <input type="text" value={customerLastName} onChange={e => setCustomerLastName(e.target.value)} placeholder="Apellido" className="w-full bg-gray-700 rounded-md p-2 text-sm" required />
                    </div>
                    <input type="email" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} placeholder="Email" className="w-full bg-gray-700 rounded-md p-2 text-sm" required />
                    <input type="tel" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="Teléfono" className="w-full bg-gray-700 rounded-md p-2 text-sm" required />
                    <input type="text" value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} placeholder="Dirección" className="w-full bg-gray-700 rounded-md p-2 text-sm" required />

                    <hr className="border-gray-700" />

                    <h3 className="text-lg font-semibold text-white">Datos de la Venta</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="salePrice" className="text-sm text-gray-400">Precio de Venta (USD)</label>
                            <input id="salePrice" type="number" value={salePrice} onChange={e => setSalePrice(e.target.value)} placeholder="Ej: 35000" className="w-full bg-gray-700 rounded-md p-2 text-sm mt-1" required />
                        </div>
                        <div>
                            <label htmlFor="financingIncome" className="text-sm text-gray-400">Ingresos Financiación (USD)</label>
                            <input id="financingIncome" type="number" value={financingIncome} onChange={e => setFinancingIncome(e.target.value)} placeholder="Ej: 1500" className="w-full bg-gray-700 rounded-md p-2 text-sm mt-1" required />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="insuranceIncome" className="text-sm text-gray-400">Ingresos Seguro (USD)</label>
                        <input id="insuranceIncome" type="number" value={insuranceIncome} onChange={e => setInsuranceIncome(e.target.value)} placeholder="Ej: 500" className="w-full bg-gray-700 rounded-md p-2 text-sm mt-1" required />
                    </div>

                    <div className="pt-4 flex justify-end">
                        <button type="submit" className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg transition-colors">
                            Confirmar Venta
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SaleModal;