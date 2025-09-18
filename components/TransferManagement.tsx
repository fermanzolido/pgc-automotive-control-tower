import React from 'react';
import type { TransferRequest, User, Dealership } from '../types';

interface TransferManagementProps {
  currentUser: User;
  transferRequests: TransferRequest[];
  allDealerships: Dealership[];
  onApprove: (transferId: string) => void;
  onReject: (transferId: string) => void;
}

const TransferManagement: React.FC<TransferManagementProps> = ({
  currentUser,
  transferRequests,
  allDealerships,
  onApprove,
  onReject
}) => {

  const incomingRequests = transferRequests.filter(
    req => req.toDealershipId === currentUser.dealershipId && req.status === 'pending'
  );

  const outgoingRequests = transferRequests.filter(
    req => req.fromDealershipId === currentUser.dealershipId
  );

  const getDealershipName = (id: string) => {
    return allDealerships.find(d => d.id === id)?.name || 'Desconocido';
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
      {/* Incoming Requests */}
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-bold mb-4 text-cyan-400">Solicitudes Entrantes ({incomingRequests.length})</h2>
        <div className="overflow-y-auto max-h-96 pr-2">
          {incomingRequests.length > 0 ? (
            <ul className="space-y-4">
              {incomingRequests.map(req => (
                <li key={req.id} className="p-4 bg-gray-700/50 rounded-lg">
                  <p className="text-white">Vehículo: <span className="font-semibold">{req.vehicleId}</span></p>
                  <p className="text-sm text-gray-400">Desde: <span className="font-semibold text-gray-300">{getDealershipName(req.fromDealershipId)}</span></p>
                  <p className="text-xs text-gray-500">Recibido: {req.createdAt.toLocaleDateString()}</p>
                  <div className="mt-3 flex space-x-3">
                    <button
                      onClick={() => onApprove(req.id)}
                      className="bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-3 rounded-lg text-xs transition-colors"
                    >
                      Aprobar
                    </button>
                    <button
                      onClick={() => onReject(req.id)}
                      className="bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-3 rounded-lg text-xs transition-colors"
                    >
                      Rechazar
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-center py-8">No hay solicitudes entrantes pendientes.</p>
          )}
        </div>
      </div>

      {/* Outgoing Requests */}
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-bold mb-4 text-cyan-400">Solicitudes Salientes ({outgoingRequests.length})</h2>
        <div className="overflow-y-auto max-h-96 pr-2">
        {outgoingRequests.length > 0 ? (
            <ul className="space-y-4">
              {outgoingRequests.map(req => (
                <li key={req.id} className="p-4 bg-gray-700/50 rounded-lg">
                  <p className="text-white">Vehículo: <span className="font-semibold">{req.vehicleId}</span></p>
                  <p className="text-sm text-gray-400">Para: <span className="font-semibold text-gray-300">{getDealershipName(req.toDealershipId)}</span></p>
                  <p className="text-sm">
                    Estado: <span className="font-semibold capitalize" style={{ color: req.status === 'approved' ? '#22c55e' : req.status === 'rejected' ? '#ef4444' : '#f59e0b' }}>
                      {req.status}
                    </span>
                  </p>
                  <p className="text-xs text-gray-500">Enviado: {req.createdAt.toLocaleDateString()}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-center py-8">No has enviado ninguna solicitud.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransferManagement;
