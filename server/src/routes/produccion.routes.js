"use strict";

import { Router } from "express";
import { createProduccion, getProducciones, getStockCamaras } from "../controllers/produccion.controller.js";
import { isOperarioOrAdmin } from "../middlewares/authorization.middleware.js";
import { authenticateJwt } from "../middlewares/authentication.middleware.js";

const router = Router();
router.use(authenticateJwt);

router.post("/", isOperarioOrAdmin, createProduccion);
router.get("/", isOperarioOrAdmin, getProducciones);
router.get("/stock-camaras", isOperarioOrAdmin, getStockCamaras);
export default router;