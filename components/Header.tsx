
import React from 'react';
import type { User } from '../types';

interface HeaderProps {
    currentUser: User;
    onLogout: () => void;
    onOpenManagementModal: () => void;
    onOpenReportModal: () => void;
    onOpenSalespersonModal: () => void;
}

const getRoleDisplayName = (role: User['role']) => {
    switch (role) {
        case 'Factory': return 'Fábrica';
        case 'DealershipAdmin': return 'Admin Concesionario';
        case 'Salesperson': return 'Vendedor';
        default: return 'Usuario';
    }
}

const Header: React.FC<HeaderProps> = ({ currentUser, onLogout, onOpenManagementModal, onOpenReportModal, onOpenSalespersonModal }) => {
  return (
    <header className="bg-gray-800 shadow-md p-4 flex items-center justify-between flex-wrap gap-4">
      <div className="flex items-center space-x-4">
        <svg className="w-10 h-10 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
        </svg>
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-wider">
          PGC - Torre de Control
        </h1>
      </div>
      <div className="flex items-center space-x-2 sm:space-x-4">
          {currentUser.role === 'Factory' && (
            <div className="flex items-center space-x-2">
              <button onClick={onOpenReportModal} className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors">
                Generar Reporte
              </button>
              <button onClick={onOpenManagementModal} className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors">
                Gestionar Red
              </button>
            </div>
          )}
          {currentUser.role === 'DealershipAdmin' && (
             <button onClick={onOpenSalespersonModal} className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors">
                Gestionar Vendedores
              </button>
          )}

          <div className='text-right'>
            <p className='font-semibold text-white'>{currentUser.name}</p>
            <p className='text-xs text-cyan-400 font-mono'>Rol: {getRoleDisplayName(currentUser.role)}</p>
          </div>
          
          <button onClick={onLogout} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors">
            Cerrar Sesión
          </button>
      </div>
    </header>
  );
};

export default Header;
