"use strict";

import { Router } from "express";
import { getProducciones, getStockCamaras, getStockContenedores, getResumenProduccionByLote, createProduccion, deleteProduccion, deleteManyProduccion, getCajaById, getStockTransito } from "../controllers/envasado.controller.js";
import { isOperarioOrAdmin } from "../middlewares/authorization.middleware.js";
import { authenticateJwt } from "../middlewares/authentication.middleware.js";
import { validateRequest } from "../middlewares/validation.middleware.js";
import { createProduccionSchema } from "../validations/produccion.schema.js";

const router = Router();
router.use(authenticateJwt);

router.post("/", authenticateJwt, isOperarioOrAdmin, validateRequest(createProduccionSchema), createProduccion);
router.post("/delete-batch", isOperarioOrAdmin, deleteManyProduccion);
router.delete("/:id", isOperarioOrAdmin, deleteProduccion);
router.get("/", isOperarioOrAdmin, getProducciones);
router.get("/stock/camaras", isOperarioOrAdmin, getStockCamaras);
router.get("/stock/contenedores", isOperarioOrAdmin, getStockContenedores);
router.get("/stock/transito", isOperarioOrAdmin, getStockTransito);
router.get("/resumen/:loteId", isOperarioOrAdmin, getResumenProduccionByLote);
router.get("/caja/:id", isOperarioOrAdmin, getCajaById);
export default router;