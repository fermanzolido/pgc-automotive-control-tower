import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import {
  Sale,
  Vehicle,
  User,
  Dealership,
  Goal,
  EnrichedSale,
  RegionalSale,
  TransferRequest,
  DemandForecast,
} from "./types";

admin.initializeApp();
const db = admin.firestore();

// Converts Firestore Timestamps to JS Date objects in nested data
const convertTimestamps = (data: any): any => {
    if (data === null || typeof data !== 'object') {
        return data;
    }
    if (data instanceof admin.firestore.Timestamp) {
        return data.toDate();
    }
    if (Array.isArray(data)) {
        return data.map(convertTimestamps);
    }
    const res: {[key: string]: any} = {};
    for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
            res[key] = convertTimestamps(data[key]);
        }
    }
    return res;
};

async function calculateAllMetrics(): Promise<object> {
  const [
    salesSnapshot,
    vehiclesSnapshot,
    usersSnapshot,
    dealershipsSnapshot,
    goalsSnapshot,
  ] = await Promise.all([
    db.collection("sales").get(),
    db.collection("vehicles").get(),
    db.collection("users").get(),
    db.collection("dealerships").get(),
    db.collection("goals").get(),
  ]);

  const allSales = salesSnapshot.docs.map(
      (doc) => convertTimestamps({id: doc.id, ...doc.data()}) as Sale,
  );
  const allVehicles = vehiclesSnapshot.docs.map(
      (doc) => ({vin: doc.id, ...doc.data()}) as Vehicle,
  );
  const allUsers = usersSnapshot.docs.map(
      (doc) => ({id: doc.id, ...doc.data()}) as User,
  );
  const allDealerships = dealershipsSnapshot.docs.map(
      (doc) => ({id: doc.id, ...doc.data()}) as Dealership,
  );
  const allGoals = goalsSnapshot.docs.map(
      (doc) => ({id: doc.id, ...doc.data()}) as Goal,
  );

  const enrichedSales: EnrichedSale[] = allSales.map((sale) => {
    const vehicle = allVehicles.find((v) => v.vin === sale.vehicleId);
    const salesperson = allUsers.find((u) => u.id === sale.salespersonId);
    const dealership = allDealerships.find(
        (d) => d.id === sale.dealershipId,
    );
    return {
      ...sale,
      vehicle: vehicle!,
      salesperson: salesperson!,
      dealership: dealership!,
    };
  }).filter((s) => s.vehicle && s.salesperson && s.dealership);

  const totalRevenue = enrichedSales.reduce(
      (sum, sale) =>
          sum + sale.salePrice + sale.financingIncome + sale.insuranceIncome, 0,
  );
  const totalProfit = enrichedSales.reduce(
      (sum, sale) => sum + sale.profit, 0,
  );
  const totalCommissions = enrichedSales.reduce(
      (sum, sale) => sum + sale.commission, 0,
  );
  const averageMargin = totalRevenue > 0 ?
    (totalProfit / totalRevenue) * 100 : 0;
  const financialKpis = {
    totalRevenue, totalProfit, totalCommissions, averageMargin,
  };

  const salesByRegion = enrichedSales.reduce((acc, sale) => {
    const province = sale.dealership.province;
    acc[province] = (acc[province] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const allRegionalSales: RegionalSale[] = allDealerships
      .map((d) => d.province)
      .filter((v, i, a) => a.indexOf(v) === i)
      .map((province) => ({
        name: province,
        ventas: salesByRegion[province] || 0,
      }));

  const currentMonth = new Date().toISOString().slice(0, 7);

  const getPerformanceData = (
    entities: (User | Dealership)[], entityType: "user" | "dealership",
  ) => {
    return entities.map((entity) => {
      const monthlySales = enrichedSales.filter((s) => {
        const entityId = entityType === "user" ?
          s.salesperson.id : s.dealership.id;
        return entityId === entity.id &&
               s.timestamp.toISOString().slice(0, 7) === currentMonth;
      });

      const totalProfit = monthlySales.reduce((acc, s) => acc + s.profit, 0);
      const salesCount = monthlySales.length;

      const profitGoal = allGoals.find(
          (g) => g.entityId === entity.id &&
                 g.month === currentMonth && g.type === "profit",
      );
      const salesCountGoal = allGoals.find(
          (g) => g.entityId === entity.id &&
                 g.month === currentMonth && g.type === "salesCount",
      );

      return {
        ...entity,
        value: totalProfit,
        salesCount: salesCount,
        dealership: (entity as User).role === "Salesperson" ?
          allDealerships.find(
              (d) => d.id === (entity as User).dealershipId,
          )?.name || "" : "",
        location: (entity as Dealership).city || "",
        profitGoal: profitGoal?.target,
        salesCountGoal: salesCountGoal?.target,
      };
    }).sort((a, b) => b.value - a.value);
  };

  const salespeople = allUsers.filter((u) => u.role === "Salesperson");
  const topSalespeople = getPerformanceData(salespeople, "user").slice(0, 10);
  const topDealerships = getPerformanceData(allDealerships, "dealership")
      .slice(0, 5);

  return {
    enrichedSales,
    allRegionalSales,
    financialKpis,
    topSalespeople,
    topDealerships,
    allVehicles,
    allDealerships,
    allUsers,
    allGoals,
    lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
  };
}

export const getDashboardMetrics = functions.https.onCall(
    async (data, context) => {
      if (!context.auth) {
        throw new functions.https.HttpsError(
            "unauthenticated", "The function must be called while authenticated.",
        );
      }
      return await calculateAllMetrics();
    },
);

const updateMetricsDocument = async () => {
    try {
        const metrics = await calculateAllMetrics();
        await db.collection("metrics").doc("dashboard").set(metrics);
        console.log("Dashboard metrics successfully updated.");
    } catch (error) {
        console.error("Error updating dashboard metrics:", error);
    }
};

export const onSaleChange = functions.firestore.document("sales/{saleId}").onWrite(updateMetricsDocument);
export const onVehicleChange = functions.firestore.document("vehicles/{vehicleId}").onWrite(updateMetricsDocument);
export const onUserChange = functions.firestore.document("users/{userId}").onWrite(updateMetricsDocument);
export const onDealershipChange = functions.firestore.document("dealerships/{dealershipId}").onWrite(updateMetricsDocument);
export const onGoalChange = functions.firestore.document("goals/{goalId}").onWrite(updateMetricsDocument);

export const generateReport = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
        "unauthenticated", "The function must be called while authenticated.",
    );
  }

  const {dealershipIds, startDate, endDate, detailed} = data;
  const selectedDealershipIds = new Set(dealershipIds);
  const start = startDate ? new Date(startDate) : new Date("1970-01-01");
  const end = endDate ? new Date(endDate) : new Date();
  end.setHours(23, 59, 59, 999);

  const [
    salesSnapshot,
    vehiclesSnapshot,
    usersSnapshot,
    dealershipsSnapshot,
  ] = await Promise.all([
    db.collection("sales").get(),
    db.collection("vehicles").get(),
    db.collection("users").get(),
    db.collection("dealerships").get(),
  ]);

  const allSales = salesSnapshot.docs.map(
      (doc) => convertTimestamps({id: doc.id, ...doc.data()}) as Sale,
  );
  const allVehicles = vehiclesSnapshot.docs.map(
      (doc) => ({vin: doc.id, ...doc.data()}) as Vehicle,
  );
  const allUsers = usersSnapshot.docs.map(
      (doc) => ({id: doc.id, ...doc.data()}) as User,
  );
  const allDealerships = dealershipsSnapshot.docs.map(
      (doc) => ({id: doc.id, ...doc.data()}) as Dealership,
  );

  const enrichedSales: EnrichedSale[] = allSales.map((sale) => {
    const vehicle = allVehicles.find((v) => v.vin === sale.vehicleId);
    const salesperson = allUsers.find((u) => u.id === sale.salespersonId);
    const dealership = allDealerships.find(
        (d) => d.id === sale.dealershipId,
    );
    return {
      ...sale,
      vehicle: vehicle!,
      salesperson: salesperson!,
      dealership: dealership!,
    };
  }).filter((s) => s.vehicle && s.salesperson && s.dealership);

  const filteredSales = enrichedSales.filter( (sale) =>
    (selectedDealershipIds.size === 0 ||
      selectedDealershipIds.has(sale.dealership.id)) &&
    (sale.timestamp >= start && sale.timestamp <= end),
  );

  const relevantDealerships = dealershipIds.length > 0 ?
    allDealerships.filter((d) => dealershipIds.includes(d.id)) : allDealerships;

  let headers: string[];
  let rows: string[][];

  if (detailed) {
    headers = ["VIN", "Modelo", "Color", "Año", "Estado Actual", "Concesionario", "Fecha Venta", "Precio Venta", "Vendedor", "Nombre Cliente", "Apellido Cliente", "Email Cliente", "Teléfono Cliente", "Dirección Cliente"];
    const relevantVehicles = allVehicles.filter( (v) =>
        selectedDealershipIds.size === 0 ||
        (v.dealershipId && selectedDealershipIds.has(v.dealershipId)),
    );
    rows = relevantVehicles.map((v) => {
      const sale = enrichedSales.find((s) => s.vehicle.vin === v.vin);
      const dealershipName = v.dealershipId ?
        allDealerships.find((d) => d.id === v.dealershipId)?.name || "" : "Fábrica";
      const isSoldInPeriod = sale && filteredSales.some((fs) => fs.id === sale.id);
      return [v.vin, v.model, v.color, v.year.toString(), v.status, dealershipName, isSoldInPeriod && sale ? sale.timestamp.toLocaleDateString("es-AR") : "", isSoldInPeriod && sale ? sale.salePrice.toString() : "", isSoldInPeriod && sale ? sale.salesperson.name : "", sale?.customerFirstName || "", sale?.customerLastName || "", sale?.customerEmail || "", sale?.customerPhone || "", sale?.customerAddress || ""];
    });
  } else {
    headers = ["Concesionario", "Modelo", "Stock Actual", "Ventas en Periodo"];
    const summary: { [key: string]: { stock: number; sales: number } } = {};
    relevantDealerships.forEach((d) => {
      const dealershipModels = [
        ...new Set(allVehicles.filter((v) => v.dealershipId === d.id)
            .map((v) => v.model)),
      ];
      dealershipModels.forEach((model) => {
        const stock = allVehicles.filter( (v) =>
            v.dealershipId === d.id && v.model === model && v.status === "In-Stock",
        ).length;
        const salesInPeriod = filteredSales.filter( (s) =>
            s.dealership.id === d.id && s.vehicle.model === model,
        ).length;
        if (stock > 0 || salesInPeriod > 0) {
          summary[`${d.name}|${model}`] = {stock, sales: salesInPeriod};
        }
      });
    });
    rows = Object.entries(summary).map(([key, value]) => {
      const [dealershipName, model] = key.split("|");
      return [dealershipName, model, value.stock.toString(),
        value.sales.toString()];
    });
  }

  const BOM = "\uFEFF";
  const separator = ";";
  const escapeCell = (cell: string) => `"${String(cell ?? "")
      .replace(/"/g, '""')}"`;
  let csvString = headers.join(separator) + "\n";
  rows.forEach((row) => {
    csvString += row.map(escapeCell).join(separator) + "\n";
  });

  return {csvString};
});

export const updateTransferStatus = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError(
            "unauthenticated", "The function must be called while authenticated.",
        );
    }

    const { transferId, status, rejectionReason } = data;
    if (!transferId || !status || (status === "rejected" && !rejectionReason)) {
        throw new functions.https.HttpsError(
            "invalid-argument", "Missing required parameters.",
        );
    }

    const uid = context.auth.uid;
    const transferRef = db.collection("transfer_requests").doc(transferId);

    return db.runTransaction(async (transaction) => {
        const transferDoc = await transaction.get(transferRef);
        if (!transferDoc.exists) {
            throw new functions.https.HttpsError("not-found", "Transfer request not found.");
        }

        const transferData = transferDoc.data() as TransferRequest;
        const userDoc = await db.collection("users").doc(uid).get();
        const currentUser = userDoc.data() as User;

        if (currentUser.role !== "DealershipAdmin" || currentUser.dealershipId !== transferData.fromDealershipId) {
            throw new functions.https.HttpsError(
                "permission-denied", "You are not authorized to perform this action.",
            );
        }

        if (transferData.status !== "pending") {
            throw new functions.https.HttpsError(
                "failed-precondition", "This request has already been processed.",
            );
        }

        const vehicleRef = db.collection("vehicles").doc(transferData.vehicleId);

        if (status === "approved") {
            transaction.update(transferRef, {
                status: "approved",
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                approvedByUserId: uid,
            });
            const arrivalDate = new Date();
            arrivalDate.setDate(arrivalDate.getDate() + 7);

            transaction.update(vehicleRef, {
                status: "Transferring",
                dealershipId: transferData.toDealershipId,
                estimatedArrivalDate: arrivalDate,
                currentLocation: "En centro de distribución de origen",
                history: admin.firestore.FieldValue.arrayUnion({
                    status: "Transferring",
                    date: admin.firestore.FieldValue.serverTimestamp(),
                }),
            });
        } else if (status === "rejected") {
            transaction.update(transferRef, {
                status: "rejected",
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                rejectionReason: rejectionReason,
            });
        }

        return { success: true, newStatus: status };
    });
});

export const calculateDemandForecast = functions.pubsub.schedule("every sunday 00:00").onRun(async (context) => {
    console.log("Running weekly demand forecast calculation...");

    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const salesSnapshot = await db.collection("sales")
        .where("timestamp", ">=", threeMonthsAgo)
        .get();

    const allSales = salesSnapshot.docs.map(doc => convertTimestamps({id: doc.id, ...doc.data()}) as Sale);

    if (allSales.length === 0) {
        console.log("No sales data in the last 3 months. Skipping forecast.");
        return null;
    }

    const enrichedSales: EnrichedSale[] = [];
    const vehiclesSnapshot = await db.collection("vehicles").get();
    const dealershipsSnapshot = await db.collection("dealerships").get();
    const allVehicles = vehiclesSnapshot.docs.map(doc => ({vin: doc.id, ...doc.data()}) as Vehicle);
    const allDealerships = dealershipsSnapshot.docs.map(doc => ({id: doc.id, ...doc.data()}) as Dealership);

    allSales.forEach(sale => {
        const vehicle = allVehicles.find(v => v.vin === sale.vehicleId);
        const dealership = allDealerships.find(d => d.id === sale.dealershipId);
        if (vehicle && dealership) {
            enrichedSales.push({ ...sale, vehicle, dealership, salesperson: {} as User });
        }
    });

    const salesByModelProvince: { [key: string]: number } = enrichedSales.reduce((acc, sale) => {
        const key = `${sale.vehicle.model}|${sale.dealership.province}`;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const batch = db.batch();

    for (const key in salesByModelProvince) {
        const [model, province] = key.split("|");
        const totalSales = salesByModelProvince[key];
        const forecastedSales = Math.ceil(totalSales / 3);

        const forecastId = `${model.toLowerCase().replace(" ", "_")}-${province.toLowerCase().replace(" ", "_")}`;
        const forecastRef = db.collection("demand_forecasts").doc(forecastId);

        batch.set(forecastRef, {
            id: forecastId,
            model,
            province,
            forecastedSales,
            lastCalculated: admin.firestore.FieldValue.serverTimestamp(),
        });
    }

    await batch.commit();
    console.log(`Demand forecast updated for ${Object.keys(salesByModelProvince).length} model/province combinations.`);
    return null;
});
