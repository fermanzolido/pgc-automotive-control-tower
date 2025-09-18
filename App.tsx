import React, { useState, useEffect, useMemo } from 'react';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import ManagementModal from './components/ManagementModal';
import SaleModal from './components/SaleModal';
import ReportModal from './components/ReportModal';
import Login from './components/Login';
import SalespersonManagementModal from './components/SalespersonManagementModal';
import type { User, Sale, Vehicle, Dealership, EnrichedSale, ReportOptions, Goal } from './types';
import { getSeedData } from './services/mockData';
import { auth, db } from './services/firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, getDocs, doc, getDoc, setDoc, deleteDoc, onSnapshot, writeBatch, updateDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';

// Helper to convert Firestore Timestamps from Cloud Function result
const convertTimestampsInObject = (data: any): any => {
    if (data === null || typeof data !== 'object') {
      return data;
    }
    // Check if it's a Firestore Timestamp object (from server or client)
    if (typeof data.toDate === 'function') {
        return data.toDate();
    }
    if (Array.isArray(data)) {
      return data.map(convertTimestampsInObject);
    }
    const res: {[key: string]: any} = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        res[key] = convertTimestampsInObject(data[key]);
      }
    }
    return res;
};


const App: React.FC = () => {
  // --- STATE MANAGEMENT ---
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isReportGenerating, setIsReportGenerating] = useState(false);

  // Modal states
  const [isManagementModalOpen, setIsManagementModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isSalespersonModalOpen, setIsSalespersonModalOpen] = useState(false);
  const [vehicleToSell, setVehicleToSell] = useState<Vehicle | null>(null);

  // Raw data states for modals & other components
  const [users, setUsers] = useState<User[]>([]);
  const [allVehicles, setAllVehicles] = useState<Vehicle[]>([]);
  const [allDealerships, setAllDealerships] = useState<Dealership[]>([]);
  const [allGoals, setAllGoals] = useState<Goal[]>([]);

  // --- DATABASE SEEDING ---
  useEffect(() => {
    const seedDatabase = async () => {
        const salesSnapshot = await getDocs(collection(db, 'sales'));
        if (salesSnapshot.empty) {
            console.log("Database is empty. Seeding data...");
            const { dealerships, vehicles } = getSeedData();
            const batch = writeBatch(db);

            dealerships.forEach(dealership => {
                const docRef = doc(db, 'dealerships', dealership.id);
                batch.set(docRef, dealership);
            });

            vehicles.forEach(vehicle => {
                const docRef = doc(db, 'vehicles', vehicle.vin);
                batch.set(docRef, vehicle);
            });

            await batch.commit();
            console.log("Database seeded successfully.");
        }
    };
    seedDatabase();
  }, []);

  // --- FIREBASE AUTH ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (userAuth) => {
        if (userAuth) {
            const userDocRef = doc(db, "users", userAuth.uid);
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists()) {
                const userData = userDocSnap.data() as Omit<User, 'id'>;
                setCurrentUser({ ...userData, id: userAuth.uid });
            } else {
                console.error("User document not found in Firestore.");
                setCurrentUser(null);
            }
        } else {
            setCurrentUser(null);
        }
        setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // --- DATA FETCHING ---
  useEffect(() => {
    if (!currentUser) return;

    // 1. Listen to the pre-computed metrics document
    const metricsDocRef = doc(db, 'metrics', 'dashboard');
    const unsubMetrics = onSnapshot(metricsDocRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = convertTimestampsInObject(docSnap.data());
            setDashboardData(data);
        } else {
            // Document might not exist on first load, can set a default state
            setDashboardData(null);
        }
        setDashboardLoading(false);
    });

    // 2. Setup listeners on raw data collections for the modals
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as User)));
    });
    const unsubDealerships = onSnapshot(collection(db, 'dealerships'), (snapshot) => {
      setAllDealerships(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Dealership)));
    });
    const unsubVehicles = onSnapshot(collection(db, 'vehicles'), (snapshot) => {
      const vehicleList = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            ...data,
            vin: doc.id,
            history: Array.isArray(data.history) ? data.history.map((h: any) => ({ ...h, date: h.date.toDate() })) : []
        } as Vehicle;
      });
      setAllVehicles(vehicleList);
    });
    const unsubGoals = onSnapshot(collection(db, 'goals'), (snapshot) => {
      setAllGoals(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Goal)));
    });

    return () => {
      unsubMetrics();
      unsubUsers();
      unsubDealerships();
      unsubVehicles();
      unsubGoals();
    };
  }, [currentUser]);

  // Client-side filtering for user-specific views (lightweight operation)
  const filteredTopSalespeople = useMemo(() => {
    if (!dashboardData || !currentUser) return [];
    if (currentUser.role === 'Factory') {
        return dashboardData.topSalespeople;
    }
    return dashboardData.topSalespeople.filter((sp: User) => sp.dealershipId === currentUser.dealershipId);
  }, [dashboardData, currentUser]);


  // --- AUTHENTICATION HANDLERS ---
  const handleLogin = async (username: string, password: string): Promise<boolean> => {
      try {
          const email = `${username.toLowerCase()}@pgc.com`;
          await signInWithEmailAndPassword(auth, email, password);
          return true;
      } catch (error) {
          console.error("Firebase Login Error:", error);
          return false;
      }
  };

  const handleLogout = async () => {
      await signOut(auth);
  };

  // --- USER MANAGEMENT HANDLERS ---
  const handleCreateUser = async (userData: Omit<User, 'id'>) => {
      try {
          const email = `${userData.username.toLowerCase()}@pgc.com`;
          const userCredential = await createUserWithEmailAndPassword(auth, email, userData.password!);
          const newUserAuth = userCredential.user;
          
          const userDataForFirestore: Omit<User, 'id' | 'password'> = { ...userData };
          delete (userDataForFirestore as any).password;

          if (userDataForFirestore.role === 'Salesperson') {
              userDataForFirestore.commissionRate = 0.1; // Default 10% commission
          }

          await setDoc(doc(db, "users", newUserAuth.uid), userDataForFirestore);
      } catch (error: any) {
          console.error("Error creating user:", error);
          if (error.code === 'auth/email-already-in-use') {
              alert('Error: El nombre de usuario ya existe.');
          } else {
              alert('Error al crear el usuario.');
          }
      }
  };

  const handleDeleteUser = async (userId: string) => {
      if (window.confirm('¿Está seguro que desea eliminar este usuario? Esta acción es irreversible.')) {
          try {
              await deleteDoc(doc(db, "users", userId));
              alert('Usuario eliminado de la base de datos de la aplicación.');
          } catch(error) {
              console.error("Error deleting user from Firestore:", error);
              alert('Ocurrió un error al eliminar el usuario.');
          }
      }
  };


  // --- ENTITY MANAGEMENT HANDLERS (FIRESTORE) ---
  const handleAddDealership = async (dealershipData: Omit<Dealership, 'id' | 'coords'>) => {
    const newCoords = { x: Math.random() * 1000, y: Math.random() * 600 };
    const newDocRef = doc(collection(db, 'dealerships'));
    await setDoc(newDocRef, { ...dealershipData, id: newDocRef.id, coords: newCoords });
  };

  const handleRemoveDealership = async (dealershipId: string) => {
      if (window.confirm('¿Está seguro que desea eliminar este concesionario? Esta acción no se puede deshacer.')) {
        await deleteDoc(doc(db, 'dealerships', dealershipId));
      }
  };

  const handleAddVehicle = async (vehicleData: { vin: string; model: string; color: string; year: number; costPrice: number }) => {
      if (allVehicles.some(v => v.vin.toLowerCase() === vehicleData.vin.toLowerCase())) {
          alert('Error: El VIN ingresado ya existe. Por favor, utilice un VIN único.');
          return;
      }
      const newVehicle: Omit<Vehicle, 'vin'> = {
        ...vehicleData,
        status: 'At-Factory',
        dealershipId: null,
        history: [{ status: 'At-Factory', date: new Date() }],
      };
      await setDoc(doc(db, 'vehicles', vehicleData.vin), newVehicle);
  };

  const handleSetGoal = async (goalData: Omit<Goal, 'id'>) => {
    const goalId = `${goalData.month}-${goalData.entityId}`;
    await setDoc(doc(db, 'goals', goalId), goalData);
  };

  const handleBulkAssignVehicles = async (vins: string[], dealershipId: string) => {
      const batch = writeBatch(db);
      const newHistoryEntry = { status: 'In-Transit' as const, date: new Date() };
      vins.forEach(vin => {
        const vehicleRef = doc(db, 'vehicles', vin);
        const currentVehicle = allVehicles.find(v => v.vin === vin);
        if (currentVehicle) {
            batch.update(vehicleRef, { 
                dealershipId,
                status: 'In-Transit',
                history: [...currentVehicle.history, newHistoryEntry]
            });
        }
      });
      await batch.commit();
  };

  const handleAcceptVehicleDelivery = async (vin: string) => {
      const vehicleRef = doc(db, 'vehicles', vin);
      const currentVehicle = allVehicles.find(v => v.vin === vin);
       if (currentVehicle) {
           await updateDoc(vehicleRef, {
               status: 'In-Stock',
               history: [...currentVehicle.history, { status: 'In-Stock' as const, date: new Date() }]
           });
       }
  };

  const handleCreateSale = async (
      vehicle: Vehicle, 
      customerData: Omit<Sale, 'id' | 'timestamp' | 'vehicleId' | 'salespersonId' | 'dealershipId' | 'profit' | 'commission'>
  ) => {
      const vehicleRef = doc(db, 'vehicles', vehicle.vin);
      const salesperson = users.find(u => u.id === currentUser!.id);

      if (!salesperson) {
          alert('Error: No se pudo encontrar la información del vendedor.');
          return;
      }

      const totalRevenue = customerData.salePrice + customerData.financingIncome + customerData.insuranceIncome;
      const profit = totalRevenue - vehicle.costPrice;
      const commission = profit * (salesperson.commissionRate || 0);

      const newSaleData: Omit<Sale, 'id'> = {
          ...customerData,
          vehicleId: vehicle.vin,
          salespersonId: currentUser!.id,
          dealershipId: vehicle.dealershipId!,
          profit,
          commission,
          timestamp: new Date(),
      };

      const batch = writeBatch(db);
      batch.set(doc(collection(db, 'sales')), newSaleData);
      batch.update(vehicleRef, {
        status: 'Sold',
        history: [...vehicle.history, { status: 'Sold' as const, date: new Date() }]
      });
      
      await batch.commit();
      setVehicleToSell(null);
  };
    
  // --- REPORT HANDLER ---
  const handleGenerateReport = async (options: ReportOptions) => {
      setIsReportGenerating(true);
      try {
          const functions = getFunctions();
          const generateReportFunc = httpsCallable(functions, 'generateReport');
          const result = await generateReportFunc(options) as { data: { csvString: string } };

          const BOM = '\uFEFF';
          const blob = new Blob([BOM + result.data.csvString], { type: 'text/csv;charset=utf-8;' });
          const link = document.createElement("a");
          link.href = URL.createObjectURL(blob);
          link.download = `reporte_pgc_${options.detailed ? 'detallado' : 'resumido'}_${new Date().toISOString().split('T')[0]}.csv`;
          link.click();
          URL.revokeObjectURL(link.href);
      } catch (error) {
          console.error("Error generating report:", error);
          alert("Ocurrió un error al generar el reporte. Por favor, intente de nuevo.");
      } finally {
          setIsReportGenerating(false);
          setIsReportModalOpen(false);
      }
  };


  // --- RENDER LOGIC ---
  if (loading) {
      return <div className="flex justify-center items-center h-screen"><div className="text-xl">Cargando Torre de Control...</div></div>;
  }

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  if (dashboardLoading || !dashboardData) {
      return (
        <div className="flex flex-col justify-center items-center h-screen bg-gray-900">
           <Header
              currentUser={currentUser}
              onLogout={handleLogout}
              onOpenManagementModal={() => {}}
              onOpenReportModal={() => {}}
              onOpenSalespersonModal={() => {}}
            />
          <div className="flex-grow flex items-center">
            <div className="text-xl text-gray-100">Estableciendo conexión en tiempo real...</div>
          </div>
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans">
      <Header 
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenManagementModal={() => setIsManagementModalOpen(true)}
        onOpenReportModal={() => setIsReportModalOpen(true)}
        onOpenSalespersonModal={() => setIsSalespersonModalOpen(true)}
      />
      <main className="p-4 sm:p-6 lg:p-8">
        <Dashboard 
          currentUser={currentUser}
          sales={dashboardData.enrichedSales}
          vehicles={allVehicles}
          dealerships={allDealerships}
          users={users}
          regionalSales={dashboardData.allRegionalSales}
          financialKpis={dashboardData.financialKpis}
          topSalespeople={filteredTopSalespeople}
          topDealerships={dashboardData.topDealerships}
          onInitiateSale={setVehicleToSell}
          onAcceptDelivery={handleAcceptVehicleDelivery}
        />
      </main>
      
      {isManagementModalOpen && currentUser.role === 'Factory' && (
        <ManagementModal 
          isOpen={isManagementModalOpen}
          onClose={() => setIsManagementModalOpen(false)}
          dealerships={allDealerships}
          vehicles={allVehicles}
          users={users}
          goals={allGoals}
          onAddDealership={handleAddDealership}
          onRemoveDealership={handleRemoveDealership}
          onAddVehicle={handleAddVehicle}
          onBulkAssignVehicles={handleBulkAssignVehicles}
          onCreateUser={handleCreateUser}
          onDeleteUser={handleDeleteUser}
          onSetGoal={handleSetGoal}
        />
      )}

      {isReportModalOpen && currentUser.role === 'Factory' && (
        <ReportModal
            isOpen={isReportModalOpen}
            onClose={() => setIsReportModalOpen(false)}
            dealerships={allDealerships}
            onGenerateReport={handleGenerateReport}
            isGenerating={isReportGenerating}
        />
      )}
      
      {isSalespersonModalOpen && currentUser.role === 'DealershipAdmin' && (
        <SalespersonManagementModal
            isOpen={isSalespersonModalOpen}
            onClose={() => setIsSalespersonModalOpen(false)}
            users={users}
            currentUser={currentUser}
            goals={allGoals}
            onCreateUser={handleCreateUser}
            onDeleteUser={handleDeleteUser}
            onSetGoal={handleSetGoal}
        />
      )}

      {vehicleToSell && (currentUser.role === 'DealershipAdmin' || currentUser.role === 'Salesperson') && (
        <SaleModal
            vehicle={vehicleToSell}
            onClose={() => setVehicleToSell(null)}
            onCreateSale={handleCreateSale}
        />
      )}
    </div>
  );
};

export default App;