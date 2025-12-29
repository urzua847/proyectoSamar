"use strict";
import { getDashboardDataService } from "../services/dashboard.service.js";
import { handleErrorServer, handleSuccess } from "../handlers/responseHandlers.js";

export async function getDashboard(req, res) {
    try {
        const [data, error] = await getDashboardDataService();
        if (error) return handleErrorServer(res, 500, error);
        handleSuccess(res, 200, "Datos del dashboard obtenidos", data);
    } catch (error) {
        handleErrorServer(res, 500, error.message);
    }
}
