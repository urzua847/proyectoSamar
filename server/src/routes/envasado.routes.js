"use strict";

import { Router } from "express";
import { getProducciones, getStockCamaras, getStockContenedores, getResumenProduccionByLote, createProduccion, deleteProduccion, deleteManyProduccion, getCajaById, getStockTransito } from "../controllers/envasado.controller.js";
import { isOperarioOrAdmin, isOperarioOrAdminOrControl } from "../middlewares/authorization.middleware.js";
import { authenticateJwt } from "../middlewares/authentication.middleware.js";
import { validateRequest } from "../middlewares/validation.middleware.js";
import { createProduccionSchema } from "../validations/produccion.schema.js";

const router = Router();
router.use(authenticateJwt);

router.post("/", authenticateJwt, isOperarioOrAdminOrControl, validateRequest(createProduccionSchema), createProduccion);
router.post("/delete-batch", isOperarioOrAdmin, deleteManyProduccion); // Control cannot delete
router.delete("/:id", isOperarioOrAdmin, deleteProduccion); // Control cannot delete
router.get("/", isOperarioOrAdminOrControl, getProducciones);
router.get("/stock/camaras", isOperarioOrAdminOrControl, getStockCamaras);
router.get("/stock/contenedores", isOperarioOrAdminOrControl, getStockContenedores);
router.get("/stock/transito", isOperarioOrAdminOrControl, getStockTransito);
router.get("/resumen/:loteId", isOperarioOrAdminOrControl, getResumenProduccionByLote);
router.get("/caja/:id", isOperarioOrAdminOrControl, getCajaById);
export default router;