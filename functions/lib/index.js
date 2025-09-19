"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.triggerMetricsUpdate = exports.updateTransferStatus = exports.generateReport = exports.onGoalChange = exports.onDealershipChange = exports.onUserChange = exports.onVehicleChange = exports.onSaleChange = exports.getDashboardMetrics = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const firestore_1 = require("firebase-functions/v2/firestore");
const https_1 = require("firebase-functions/v2/https");
admin.initializeApp();
const db = admin.firestore();
/**
 * The core logic for calculating all dashboard metrics.
 * Fetches all data and computes aggregations from a global perspective.
 * @return {Promise<object>} A promise that resolves to the full metrics object.
 */
async function calculateAllMetrics() {
    // --- DATA FETCHING ---
    const [salesSnapshot, vehiclesSnapshot, usersSnapshot, dealershipsSnapshot, goalsSnapshot,] = await Promise.all([
        db.collection("sales").get(),
        db.collection("vehicles").get(),
        db.collection("users").get(),
        db.collection("dealerships").get(),
        db.collection("goals").get(),
    ]);
    const allSales = salesSnapshot.docs.map((doc) => convertTimestamps(Object.assign({ id: doc.id }, doc.data())));
    const allVehicles = vehiclesSnapshot.docs.map((doc) => (Object.assign({ vin: doc.id }, doc.data())));
    const allUsers = usersSnapshot.docs.map((doc) => (Object.assign({ id: doc.id }, doc.data())));
    const allDealerships = dealershipsSnapshot.docs.map((doc) => (Object.assign({ id: doc.id }, doc.data())));
    const allGoals = goalsSnapshot.docs.map((doc) => (Object.assign({ id: doc.id }, doc.data())));
    // --- DATA PROCESSING & ENRICHMENT ---
    const enrichedSales = allSales.map((sale) => {
        const vehicle = allVehicles.find((v) => v.vin === sale.vehicleId);
        const salesperson = allUsers.find((u) => u.id === sale.salespersonId);
        const dealership = allDealerships.find((d) => d.id === sale.dealershipId);
        return Object.assign(Object.assign({}, sale), { vehicle: vehicle, salesperson: salesperson, dealership: dealership });
    }).filter((s) => s.vehicle && s.salesperson && s.dealership);
    // --- CALCULATIONS ---
    // 1. Financial KPIs
    const totalRevenue = enrichedSales.reduce((sum, sale) => sum + sale.salePrice + sale.financingIncome + sale.insuranceIncome, 0);
    const totalProfit = enrichedSales.reduce((sum, sale) => sum + sale.profit, 0);
    const totalCommissions = enrichedSales.reduce((sum, sale) => sum + sale.commission, 0);
    const averageMargin = totalRevenue > 0 ?
        (totalProfit / totalRevenue) * 100 : 0;
    const financialKpis = {
        totalRevenue, totalProfit, totalCommissions, averageMargin,
    };
    // 2. Regional Sales
    const salesByRegion = enrichedSales.reduce((acc, sale) => {
        const province = sale.dealership.province;
        acc[province] = (acc[province] || 0) + 1;
        return acc;
    }, {});
    const allRegionalSales = allDealerships
        .map((d) => d.province)
        .filter((v, i, a) => a.indexOf(v) === i)
        .map((province) => ({
        name: province,
        ventas: salesByRegion[province] || 0,
    }));
    // 3. Top Performers (Global)
    const currentMonth = new Date().toISOString().slice(0, 7);
    const getPerformanceData = (entities, entityType) => {
        return entities.map((entity) => {
            var _a;
            const monthlySales = enrichedSales.filter((s) => {
                const entityId = entityType === "user" ?
                    s.salesperson.id : s.dealership.id;
                return entityId === entity.id &&
                    s.timestamp.toISOString().slice(0, 7) === currentMonth;
            });
            const totalProfit = monthlySales.reduce((acc, s) => acc + s.profit, 0);
            const salesCount = monthlySales.length;
            const profitGoal = allGoals.find((g) => g.entityId === entity.id &&
                g.month === currentMonth && g.type === "profit");
            const salesCountGoal = allGoals.find((g) => g.entityId === entity.id &&
                g.month === currentMonth && g.type === "salesCount");
            return Object.assign(Object.assign({}, entity), { value: totalProfit, salesCount: salesCount, dealership: entity.role === "Salesperson" ?
                    ((_a = allDealerships.find((d) => d.id === entity.dealershipId)) === null || _a === void 0 ? void 0 : _a.name) || "" : "", location: entity.city || "", profitGoal: profitGoal === null || profitGoal === void 0 ? void 0 : profitGoal.target, salesCountGoal: salesCountGoal === null || salesCountGoal === void 0 ? void 0 : salesCountGoal.target });
        }).sort((a, b) => b.value - a.value);
    };
    const salespeople = allUsers.filter((u) => u.role === "Salesperson");
    const topSalespeople = getPerformanceData(salespeople, "user").slice(0, 10);
    const topDealerships = getPerformanceData(allDealerships, "dealership")
        .slice(0, 5);
    // --- RETURN ---
    return {
        enrichedSales,
        allRegionalSales,
        financialKpis,
        topSalespeople,
        topDealerships,
        // Include raw data for client-side filtering if needed
        allVehicles,
        allDealerships,
        allUsers,
        allGoals,
        // Add a timestamp for when the metrics were last updated
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
    };
}
// Converts Firestore Timestamps to JS Date objects in nested data
const convertTimestamps = (data) => {
    if (data === null || typeof data !== 'object') {
        return data;
    }
    if (data instanceof admin.firestore.Timestamp) {
        return data.toDate();
    }
    if (Array.isArray(data)) {
        return data.map(convertTimestamps);
    }
    const res = {};
    for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
            res[key] = convertTimestamps(data[key]);
        }
    }
    return res;
};
/**
 * On-demand function for clients to get the latest metrics.
 * This can be used for the initial load.
 */
exports.getDashboardMetrics = (0, https_1.onCall)(async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "The function must be called while authenticated.");
    }
    // For on-demand, we can either read the pre-computed doc or re-calculate.
    // Re-calculating ensures the user gets the absolute latest data.
    return await calculateAllMetrics();
});
/**
 * Firestore trigger to update the pre-computed metrics document when
 * any relevant data changes.
 */
const updateMetricsDocument = async () => {
    try {
        const metrics = await calculateAllMetrics();
        await db.collection("metrics").doc("dashboard").set(metrics);
        console.log("Dashboard metrics successfully updated.");
    }
    catch (error) {
        console.error("Error updating dashboard metrics:", error);
    }
};
// Create triggers for all relevant collections
exports.onSaleChange = (0, firestore_1.onDocumentWritten)("sales/{saleId}", (event) => {
    return updateMetricsDocument();
});
exports.onVehicleChange = (0, firestore_1.onDocumentWritten)("vehicles/{vehicleId}", (event) => {
    return updateMetricsDocument();
});
exports.onUserChange = (0, firestore_1.onDocumentWritten)("users/{userId}", (event) => {
    return updateMetricsDocument();
});
exports.onDealershipChange = (0, firestore_1.onDocumentWritten)("dealerships/{dealershipId}", (event) => {
    return updateMetricsDocument();
});
exports.onGoalChange = (0, firestore_1.onDocumentWritten)("goals/{goalId}", (event) => {
    return updateMetricsDocument();
});
exports.generateReport = (0, https_1.onCall)(async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "The function must be called while authenticated.");
    }
    const { dealershipIds, startDate, endDate, detailed } = request.data;
    const selectedDealershipIds = new Set(dealershipIds);
    const start = startDate ? new Date(startDate) : new Date("1970-01-01");
    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);
    // --- DATA FETCHING ---
    const [salesSnapshot, vehiclesSnapshot, usersSnapshot, dealershipsSnapshot,] = await Promise.all([
        db.collection("sales").get(),
        db.collection("vehicles").get(),
        db.collection("users").get(),
        db.collection("dealerships").get(),
    ]);
    const allSales = salesSnapshot.docs.map((doc) => convertTimestamps(Object.assign({ id: doc.id }, doc.data())));
    const allVehicles = vehiclesSnapshot.docs.map((doc) => (Object.assign({ vin: doc.id }, doc.data())));
    const allUsers = usersSnapshot.docs.map((doc) => (Object.assign({ id: doc.id }, doc.data())));
    const allDealerships = dealershipsSnapshot.docs.map((doc) => (Object.assign({ id: doc.id }, doc.data())));
    // --- DATA PROCESSING ---
    const enrichedSales = allSales.map((sale) => {
        const vehicle = allVehicles.find((v) => v.vin === sale.vehicleId);
        const salesperson = allUsers.find((u) => u.id === sale.salespersonId);
        const dealership = allDealerships.find((d) => d.id === sale.dealershipId);
        return Object.assign(Object.assign({}, sale), { vehicle: vehicle, salesperson: salesperson, dealership: dealership });
    }).filter((s) => s.vehicle && s.salesperson && s.dealership);
    const filteredSales = enrichedSales.filter((sale) => (selectedDealershipIds.size === 0 ||
        selectedDealershipIds.has(sale.dealership.id)) &&
        (sale.timestamp >= start && sale.timestamp <= end));
    const relevantDealerships = dealershipIds.length > 0 ?
        allDealerships.filter((d) => dealershipIds.includes(d.id)) : allDealerships;
    let headers;
    let rows;
    if (detailed) {
        headers = ["VIN", "Modelo", "Color", "Año", "Estado Actual", "Concesionario", "Fecha Venta", "Precio Venta", "Vendedor", "Nombre Cliente", "Apellido Cliente", "Email Cliente", "Teléfono Cliente", "Dirección Cliente"];
        const relevantVehicles = allVehicles.filter((v) => selectedDealershipIds.size === 0 ||
            (v.dealershipId && selectedDealershipIds.has(v.dealershipId)));
        rows = relevantVehicles.map((v) => {
            var _a;
            const sale = enrichedSales.find((s) => s.vehicle.vin === v.vin);
            const dealershipName = v.dealershipId ?
                ((_a = allDealerships.find((d) => d.id === v.dealershipId)) === null || _a === void 0 ? void 0 : _a.name) || "" : "Fábrica";
            const isSoldInPeriod = sale && filteredSales.some((fs) => fs.id === sale.id);
            return [v.vin, v.model, v.color, v.year.toString(), v.status, dealershipName, isSoldInPeriod && sale ? sale.timestamp.toLocaleDateString("es-AR") : "", isSoldInPeriod && sale ? sale.salePrice.toString() : "", isSoldInPeriod && sale ? sale.salesperson.name : "", (sale === null || sale === void 0 ? void 0 : sale.customerFirstName) || "", (sale === null || sale === void 0 ? void 0 : sale.customerLastName) || "", (sale === null || sale === void 0 ? void 0 : sale.customerEmail) || "", (sale === null || sale === void 0 ? void 0 : sale.customerPhone) || "", (sale === null || sale === void 0 ? void 0 : sale.customerAddress) || ""];
        });
    }
    else {
        headers = ["Concesionario", "Modelo", "Stock Actual", "Ventas en Periodo"];
        const summary = {};
        relevantDealerships.forEach((d) => {
            const dealershipModels = [
                ...new Set(allVehicles.filter((v) => v.dealershipId === d.id)
                    .map((v) => v.model)),
            ];
            dealershipModels.forEach((model) => {
                const stock = allVehicles.filter((v) => v.dealershipId === d.id && v.model === model && v.status === "In-Stock").length;
                const salesInPeriod = filteredSales.filter((s) => s.dealership.id === d.id && s.vehicle.model === model).length;
                if (stock > 0 || salesInPeriod > 0) {
                    summary[`${d.name}|${model}`] = { stock, sales: salesInPeriod };
                }
            });
        });
        rows = Object.entries(summary).map(([key, value]) => {
            const [dealershipName, model] = key.split("|");
            return [dealershipName, model, value.stock.toString(),
                value.sales.toString()];
        });
    }
    const separator = ";";
    const escapeCell = (cell) => `"${String(cell !== null && cell !== void 0 ? cell : "")
        .replace(/"/g, '""')}"`;
    let csvString = headers.join(separator) + "\n";
    rows.forEach((row) => {
        csvString += row.map(escapeCell).join(separator) + "\n";
    });
    return { csvString };
});
exports.updateTransferStatus = (0, https_1.onCall)(async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "The function must be called while authenticated.");
    }
    const { transferId, status, rejectionReason } = request.data;
    if (!transferId || !status || (status === "rejected" && !rejectionReason)) {
        throw new https_1.HttpsError("invalid-argument", "Missing required parameters.");
    }
    const uid = request.auth.uid;
    const transferRef = db.collection("transfer_requests").doc(transferId);
    return db.runTransaction(async (transaction) => {
        const transferDoc = await transaction.get(transferRef);
        if (!transferDoc.exists) {
            throw new functions.https.HttpsError("not-found", "Transfer request not found.");
        }
        const transferData = transferDoc.data();
        const userDoc = await db.collection("users").doc(uid).get();
        const currentUser = userDoc.data();
        if (currentUser.role !== "DealershipAdmin" || currentUser.dealershipId !== transferData.fromDealershipId) {
            throw new functions.https.HttpsError("permission-denied", "You are not authorized to perform this action.");
        }
        if (transferData.status !== "pending") {
            throw new functions.https.HttpsError("failed-precondition", "This request has already been processed.");
        }
        const vehicleRef = db.collection("vehicles").doc(transferData.vehicleId);
        if (status === "approved") {
            transaction.update(transferRef, {
                status: "approved",
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                approvedByUserId: uid,
            });
            transaction.update(vehicleRef, {
                status: "Transferring",
                dealershipId: transferData.toDealershipId,
                history: admin.firestore.FieldValue.arrayUnion({
                    status: "Transferring",
                    date: admin.firestore.FieldValue.serverTimestamp(),
                }),
            });
        }
        else if (status === "rejected") {
            transaction.update(transferRef, {
                status: "rejected",
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                rejectionReason: rejectionReason,
            });
        }
        return { success: true, newStatus: status };
    });
});
const cors_1 = __importDefault(require("cors"));
const corsHandler = (0, cors_1.default)({ origin: true });
exports.triggerMetricsUpdate = functions.https.onRequest((request, response) => {
    corsHandler(request, response, async () => {
        await updateMetricsDocument();
        response.status(200).send({ success: true });
    });
});
//# sourceMappingURL=index.js.map