export interface Dealership {
  id: string; // Changed to string for Firestore compatibility
  name: string;
  city: string;
  province: string;
  coords: { x: number; y: number };
}

export type VehicleStatus = 'At-Factory' | 'In-Transit' | 'Arrived' | 'In-Stock' | 'Sold' | 'Transferring';

export interface VehicleHistory {
  status: VehicleStatus;
  date: Date;
}

export interface Vehicle {
  vin: string;
  model: string;
  color: string;
  year: number;
  costPrice: number; // Costo de fábrica del vehículo
  status: VehicleStatus;
  dealershipId: string | null; // Changed to string
  history: VehicleHistory[];
  // New fields for detailed logistic tracking
  estimatedArrivalDate?: Date;
  currentLocation?: string;
}

// Stored in Firestore
export interface Sale {
  id: string;
  vehicleId: string;
  salespersonId: string;
  dealershipId: string;
  customerFirstName: string;
  customerLastName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  salePrice: number;
  financingIncome: number; // Ingresos extra por financiación
  insuranceIncome: number; // Ingresos extra por seguros
  profit: number; // Campo calculado: (salePrice + financingIncome + insuranceIncome) - vehicle.costPrice
  commission: number; // Campo calculado: profit * salesperson.commissionRate
  timestamp: Date;
}

// Used in the client after combining data
export interface EnrichedSale extends Omit<Sale, 'vehicleId' | 'salespersonId' | 'dealershipId'> {
  vehicle: Vehicle;
  salesperson: User;
  dealership: Dealership;
}

export interface RegionalSale {
    name: string;
    ventas: number;
}

export type Role = 'Factory' | 'DealershipAdmin' | 'Salesperson';

export interface User {
  id: string;
  username: string;
  password?: string;
  name: string;
  role: Role;
  dealershipId?: string; // Changed to string
  commissionRate?: number; // Tasa de comisión para vendedores (ej: 0.1 para 10%)
}

export type TransferRequestStatus = 'pending' | 'approved' | 'rejected' | 'completed';

export interface TransferRequest {
  id: string;
  vehicleId: string;
  fromDealershipId: string;
  toDealershipId: string;
  requestingUserId: string;
  status: TransferRequestStatus;
  createdAt: Date;
  updatedAt: Date;
  // Optional fields for tracking the transfer process
  approvedByUserId?: string;
  rejectionReason?: string;
  shippedAt?: Date;
  receivedAt?: Date;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
}

export interface ReportOptions {
    dealershipIds: string[];
    startDate: string;
    endDate: string;
    detailed: boolean;
}

export interface Goal {
  id: string; // Composite ID, e.g., YYYY-MM-entityId
  entityId: string; // ID of User (Salesperson) or Dealership
  type: 'salesCount' | 'profit';
  target: number;
  month: string; // YYYY-MM format
}

