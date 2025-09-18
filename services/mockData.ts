
import type { Dealership, Vehicle, VehicleStatus, VehicleHistory } from '../types';

const DEALERSHIPS_SEED: Omit<Dealership, 'id' | 'coords'>[] = [
  { name: 'Auto del Sol', city: 'Buenos Aires', province: 'Buenos Aires', coords: { lat: -34.6037, lng: -58.3816 } },
  { name: 'Córdoba Motors', city: 'Córdoba', province: 'Córdoba', coords: { lat: -31.4201, lng: -64.1888 } },
  { name: 'Rosario Automotores', city: 'Rosario', province: 'Santa Fe', coords: { lat: -32.9445, lng: -60.6393 } },
  { name: 'Norte Rodados', city: 'Salta', province: 'Salta', coords: { lat: -24.7829, lng: -65.4117 } },
  { name: 'Cuyo Cars', city: 'Mendoza', province: 'Mendoza', coords: { lat: -32.8895, lng: -68.8458 } },
  { name: 'Patagonia Sur', city: 'Comodoro Rivadavia', province: 'Chubut', coords: { lat: -45.8641, lng: -67.4969 } },
];

export const VEHICLES_MODELS = [
    { model: 'Ranger', colors: ['Rojo Furia', 'Plata Metalizado', 'Azul Eléctrico'] },
    { model: 'Maverick', colors: ['Naranja Atardecer', 'Gris Grafito', 'Blanco Nieve'] },
    { model: 'Bronco', colors: ['Verde Oliva', 'Negro Sombra', 'Arena Desierto'] },
    { model: 'Mustang Mach-E', colors: ['Azul Impacto', 'Rojo Racing', 'Gris Magnético'] },
];

const generateVIN = (): string => `V${Math.random().toString(36).substring(2, 10).toUpperCase()}${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

const getRandomElement = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const MODEL_COSTS: { [key: string]: number } = {
    'Ranger': 35000,
    'Maverick': 28000,
    'Bronco': 42000,
    'Mustang Mach-E': 50000,
};

const generateInitialInventory = (dealerships: Dealership[]): Vehicle[] => {
    const inventory: Vehicle[] = [];
    const totalVehicles = dealerships.length * 50 + 20; // Add 20 factory vehicles

    for (let i = 0; i < totalVehicles; i++) {
        const vehicleInfo = getRandomElement(VEHICLES_MODELS);
        const isAssigned = i >= 20; // First 20 are 'At-Factory'
        const dealership = isAssigned ? getRandomElement(dealerships) : null;
        
        let status: VehicleStatus = 'At-Factory';
        let dealershipId: string | null = null;
        const history: VehicleHistory[] = [{ status: 'At-Factory', date: new Date(Date.now() - Math.floor(Math.random() * 40) * 24 * 60 * 60 * 1000) }];

        if (isAssigned && dealership) {
            dealershipId = dealership.id;
            const rand = Math.random();
            const transitDate = new Date(history[0].date.getTime() + 24 * 60 * 60 * 1000);
            history.push({ status: 'In-Transit', date: transitDate });

            if (rand < 0.4) { // 40% In-Transit
                status = 'In-Transit';
            } else if (rand < 0.7) { // 30% Arrived
                status = 'Arrived';
                const arrivedDate = new Date(transitDate.getTime() + Math.floor(Math.random() * 8 + 1) * 24 * 60 * 60 * 1000);
                history.push({ status: 'Arrived', date: arrivedDate });
            } else { // 30% In-Stock
                status = 'In-Stock';
                const arrivedDate = new Date(transitDate.getTime() + Math.floor(Math.random() * 8 + 1) * 24 * 60 * 60 * 1000);
                history.push({ status: 'Arrived', date: arrivedDate });
                const stockDate = new Date(arrivedDate.getTime() + 60 * 60 * 1000); // 1 hour to check in
                history.push({ status: 'In-Stock', date: stockDate });
            }
        }
        
        inventory.push({
            vin: generateVIN(),
            model: vehicleInfo.model,
            color: getRandomElement(vehicleInfo.colors),
            year: new Date().getFullYear(),
            costPrice: MODEL_COSTS[vehicleInfo.model] || 30000,
            status,
            dealershipId,
            history,
        });
    }
    return inventory;
};

export const getSeedData = () => {
    const dealerships: Dealership[] = DEALERSHIPS_SEED.map((d, index) => ({
        ...d,
        id: `dealership-${index + 1}`
    }));

    const vehicles = generateInitialInventory(dealerships);
    
    return {
        dealerships,
        vehicles
    }
}
