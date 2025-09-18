export interface Dealership {
  id: string;
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
  costPrice: number;
  status: VehicleStatus;
  dealershipId: string | null;
  history: VehicleHistory[];
  estimatedArrivalDate?: Date;
  currentLocation?: string;
}

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
  financingIncome: number;
  insuranceIncome: number;
  profit: number;
  commission: number;
  timestamp: Date;
}

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
  dealershipId?: string;
  commissionRate?: number;
}

export interface Goal {
  id: string;
  entityId: string;
  type: 'salesCount' | 'profit';
  target: number;
  month: string; // YYYY-MM format
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
  approvedByUserId?: string;
  rejectionReason?: string;
  shippedAt?: Date;
  receivedAt?: Date;
}

export interface DemandForecast {
    id: string; // e.g., 'corolla-buenos_aires'
    model: string;
    province: string;
    forecastedSales: number;
    lastCalculated: Date;
}
