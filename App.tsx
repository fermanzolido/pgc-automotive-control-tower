import React, { useState, useEffect, useMemo } from 'react';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import ManagementModal from './components/ManagementModal';
import SaleModal from './components/SaleModal';
import ReportModal from './components/ReportModal';
import Login from './components/Login';
import SalespersonManagementModal from './components/SalespersonManagementModal';
import type { User, Sale, Vehicle, Dealership, RegionalSale, EnrichedSale, ReportOptions, Goal } from './types';
import { getSeedData } from './services/mockData';
import { auth, db } from './services/firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, getDocs, doc, getDoc, setDoc, deleteDoc, onSnapshot, writeBatch, addDoc, query, where, Timestamp, updateDoc } from 'firebase/firestore';

const App: React.FC = () => {
  // --- STATE MANAGEMENT ---
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [isManagementModalOpen, setIsManagementModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isSalespersonModalOpen, setIsSalespersonModalOpen] = useState(false);
  const [vehicleToSell, setVehicleToSell] = useState<Vehicle | null>(null);

  // Data State
  const [allSales, setAllSales] = useState<Sale[]>([]);
  const [allVehicles, setAllVehicles] = useState<Vehicle[]>([]);
  const [allDealerships, setAllDealerships] = useState<Dealership[]>([]);
  const [allGoals, setAllGoals] = useState<Goal[]>([]);

  // --- DATABASE SEEDING ---
  useEffect(() => {
    const seedDatabase = async () => {
        const dealershipsCollection = collection(db, 'dealerships');
        const snapshot = await getDocs(dealershipsCollection);
        if (snapshot.empty) {
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

  // --- FIREBASE AUTH & DATA LOADING ---
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

  useEffect(() => {
    if (!currentUser) return;

    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const userList = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as User));
      setUsers(userList);
    });

    const unsubDealerships = onSnapshot(collection(db, 'dealerships'), (snapshot) => {
      const dealershipList = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Dealership));
      setAllDealerships(dealershipList);
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
    
    const unsubSales = onSnapshot(collection(db, 'sales'), (snapshot) => {
      const salesList = snapshot.docs.map(doc => {
        const data = doc.data();
        return { 
            ...data, 
            id: doc.id,
            timestamp: data.timestamp.toDate() 
        } as Sale;
      }).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      setAllSales(salesList);
    });

    const unsubGoals = onSnapshot(collection(db, 'goals'), (snapshot) => {
      const goalsList = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Goal));
      setAllGoals(goalsList);
    });
    
    return () => {
      unsubUsers();
      unsubDealerships();
      unsubVehicles();
      unsubSales();
      unsubGoals();
    };
  }, [currentUser]);

  // Derived and Enriched Data
  const enrichedSales = useMemo((): EnrichedSale[] => {
    return allSales.map(sale => {
      const vehicle = allVehicles.find(v => v.vin === sale.vehicleId);
      const salesperson = users.find(u => u.id === sale.salespersonId);
      const dealership = allDealerships.find(d => d.id === sale.dealershipId);
      return {
        ...sale,
        vehicle: vehicle!,
        salesperson: salesperson!,
        dealership: dealership!
      }
    }).filter(s => s.vehicle && s.salesperson && s.dealership);
  }, [allSales, allVehicles, users, allDealerships]);

  const allRegionalSales = useMemo((): RegionalSale[] => {
    const salesByRegion = enrichedSales.reduce((acc, sale) => {
      const province = sale.dealership.province;
      acc[province] = (acc[province] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return allDealerships.map(d => d.province).filter((v, i, a) => a.indexOf(v) === i)
      .map(province => ({
        name: province,
        ventas: salesByRegion[province] || 0
      }));
  }, [enrichedSales, allDealerships]);

  const financialKpis = useMemo(() => {
    const totalRevenue = enrichedSales.reduce((sum, sale) => sum + sale.salePrice + sale.financingIncome + sale.insuranceIncome, 0);
    const totalProfit = enrichedSales.reduce((sum, sale) => sum + sale.profit, 0);
    const totalCommissions = enrichedSales.reduce((sum, sale) => sum + sale.commission, 0);
    const averageMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    return { totalRevenue, totalProfit, totalCommissions, averageMargin };
  }, [enrichedSales]);

  const { topSalespeople, topDealerships } = useMemo(() => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const isFactoryUser = currentUser?.role === 'Factory';

    const getPerformanceData = (entities: (User | Dealership)[], entityType: 'user' | 'dealership') => {
        return entities.map(entity => {
            const monthlySales = enrichedSales.filter(s => {
                const entityId = entityType === 'user' ? s.salesperson.id : s.dealership.id;
                return entityId === entity.id && s.timestamp.toISOString().slice(0, 7) === currentMonth;
            });

            const totalProfit = monthlySales.reduce((acc, s) => acc + s.profit, 0);
            const salesCount = monthlySales.length;

            const profitGoal = allGoals.find(g => g.entityId === entity.id && g.month === currentMonth && g.type === 'profit');
            const salesCountGoal = allGoals.find(g => g.entityId === entity.id && g.month === currentMonth && g.type === 'salesCount');

            return {
                ...entity,
                value: totalProfit, // Primary value is profit
                salesCount: salesCount,
                dealership: (entity as User).role === 'Salesperson' ? allDealerships.find(d => d.id === (entity as User).dealershipId)?.name || '' : '',
                location: (entity as Dealership).city || '',
                profitGoal: profitGoal?.target,
                salesCountGoal: salesCountGoal?.target,
            };
        }).sort((a, b) => b.value - a.value);
    };

    const salespeople = users.filter(u => u.role === 'Salesperson');
    const targetSalespeople = isFactoryUser ? salespeople : salespeople.filter(sp => sp.dealershipId === currentUser?.dealershipId);

    const topSalespeople = getPerformanceData(targetSalespeople, 'user').slice(0, 5);
    const topDealerships = isFactoryUser ? getPerformanceData(allDealerships, 'dealership').slice(0, 5) : [];

    return { topSalespeople, topDealerships };
  }, [enrichedSales, users, allDealerships, currentUser, allGoals]);


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
              // Deleting Auth users requires a backend function for security.
              // This will only delete the Firestore record.
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
    // TODO: Use a geocoding service to get real coords from city/province
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
  const handleGenerateReport = (options: ReportOptions) => {
      const { dealershipIds, startDate, endDate, detailed } = options;
      const selectedDealershipIds = new Set(dealershipIds);
      const start = startDate ? new Date(startDate) : new Date('1970-01-01');
      const end = endDate ? new Date(endDate) : new Date();
      end.setHours(23, 59, 59, 999); 

      const filteredSales = enrichedSales.filter(sale => 
          (selectedDealershipIds.size === 0 || selectedDealershipIds.has(sale.dealership.id)) &&
          (sale.timestamp >= start && sale.timestamp <= end)
      );

      const relevantDealerships = dealershipIds.length > 0
          ? allDealerships.filter(d => dealershipIds.includes(d.id))
          : allDealerships;

      let headers: string[], rows: string[][];

      if (detailed) {
          headers = ['VIN', 'Modelo', 'Color', 'Año', 'Estado Actual', 'Concesionario', 'Fecha Venta', 'Precio Venta', 'Vendedor', 'Nombre Cliente', 'Apellido Cliente', 'Email Cliente', 'Teléfono Cliente', 'Dirección Cliente'];
          const relevantVehicles = allVehicles.filter(v => selectedDealershipIds.size === 0 || (v.dealershipId && selectedDealershipIds.has(v.dealershipId)));
          rows = relevantVehicles.map(v => {
              const sale = enrichedSales.find(s => s.vehicle.vin === v.vin);
              const dealershipName = v.dealershipId ? allDealerships.find(d => d.id === v.dealershipId)?.name || '' : 'Fábrica';
              const isSoldInPeriod = sale && filteredSales.some(fs => fs.id === sale.id);
              return [ v.vin, v.model, v.color, v.year.toString(), v.status, dealershipName, isSoldInPeriod && sale ? sale.timestamp.toLocaleDateString('es-AR') : '', isSoldInPeriod && sale ? sale.salePrice.toString() : '', isSoldInPeriod && sale ? sale.salesperson.name : '', sale?.customerFirstName || '', sale?.customerLastName || '', sale?.customerEmail || '', sale?.customerPhone || '', sale?.customerAddress || '' ];
          });
      } else {
          headers = ['Concesionario', 'Modelo', 'Stock Actual', 'Ventas en Periodo'];
          const summary: { [key: string]: { stock: number; sales: number } } = {};
          relevantDealerships.forEach(d => {
              const dealershipModels = [...new Set(allVehicles.filter(v => v.dealershipId === d.id).map(v => v.model))];
              dealershipModels.forEach(model => {
                  const stock = allVehicles.filter(v => v.dealershipId === d.id && v.model === model && v.status === 'In-Stock').length;
                  const salesInPeriod = filteredSales.filter(s => s.dealership.id === d.id && s.vehicle.model === model).length;
                  if (stock > 0 || salesInPeriod > 0) {
                      summary[`${d.name}|${model}`] = { stock, sales: salesInPeriod };
                  }
              });
          });
          rows = Object.entries(summary).map(([key, value]) => {
              const [dealershipName, model] = key.split('|');
              return [dealershipName, model, value.stock.toString(), value.sales.toString()];
          });
      }
      
      const BOM = '\uFEFF', separator = ';';
      const escapeCell = (cell: string) => `"${String(cell ?? '').replace(/"/g, '""')}"`;
      let csvString = headers.join(separator) + '\n';
      rows.forEach(row => { csvString += row.map(escapeCell).join(separator) + '\n'; });

      const blob = new Blob([BOM + csvString], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `reporte_pgc_${detailed ? 'detallado' : 'resumido'}_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(link.href);
      setIsReportModalOpen(false);
  };


  // --- RENDER LOGIC ---
  if (loading) {
      return <div className="flex justify-center items-center h-screen"><div className="text-xl">Cargando Torre de Control...</div></div>;
  }

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
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
          sales={enrichedSales}
          vehicles={allVehicles}
          dealerships={allDealerships}
          users={users}
          regionalSales={allRegionalSales}
          financialKpis={financialKpis}
          topSalespeople={topSalespeople}
          topDealerships={topDealerships}
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