"use strict";

import { Router } from "express";
import { createProduccion, deleteProduccion, deleteManyProduccion, getProducciones, getStockCamaras, getStockContenedores, getResumenProduccionByLote } from "../controllers/envasado.controller.js";
import { isOperarioOrAdmin } from "../middlewares/authorization.middleware.js";
import { authenticateJwt } from "../middlewares/authentication.middleware.js";

const router = Router();
router.use(authenticateJwt);

router.post("/", isOperarioOrAdmin, createProduccion);
router.post("/delete-batch", isOperarioOrAdmin, deleteManyProduccion);
router.delete("/:id", isOperarioOrAdmin, deleteProduccion);
router.get("/", isOperarioOrAdmin, getProducciones);
router.get("/stock/camaras", isOperarioOrAdmin, getStockCamaras);
router.get("/stock/contenedores", isOperarioOrAdmin, getStockContenedores);
router.get("/resumen/:loteId", isOperarioOrAdmin, getResumenProduccionByLote);
export default router;