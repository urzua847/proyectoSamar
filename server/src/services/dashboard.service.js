"use strict";
import { AppDataSource } from "../config/configDb.js";
import LoteRecepcion from "../entity/loteRecepcion.entity.js";
import { getStockCamarasService, getStockContenedoresService } from "./envasado.service.js";

const loteRepository = AppDataSource.getRepository(LoteRecepcion);

export async function getDashboardDataService() {
    try {
        // 1. Ultimos 5 Lotes Recepcionados
        const ultimosLotes = await loteRepository.find({
            relations: ["proveedor", "materiaPrima"],
            order: { createdAt: "DESC" },
            take: 5
        });

        // 2. Stock en Camaras 
        const [stockCamaras, errorCamaras] = await getStockCamarasService();
        if (errorCamaras) throw new Error(errorCamaras);

        // 3. Stock en Contenedores
        const [stockContenedores, errorContenedores] = await getStockContenedoresService();
        if (errorContenedores) throw new Error(errorContenedores);

        return [{
            ultimosLotes,
            stockCamaras,
            stockContenedores
        }, null];

    } catch (error) {
        console.error("Error getDashboardDataService:", error);
        return [null, error.message];
    }
}
