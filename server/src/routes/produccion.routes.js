"use strict";
import { Router } from "express";
import { createProduccionYield, getProduccionesByLote, getProduccionByLote, updateProduccionYield } from "../controllers/produccion.controller.js";
import { authenticateJwt } from "../middlewares/authentication.middleware.js";

const router = Router();

router.use(authenticateJwt);

router.post("/", createProduccionYield);
router.get("/historial/:loteId", getProduccionesByLote);
router.get("/lote/:loteId", getProduccionByLote);
router.put("/lote/:loteId", updateProduccionYield);

export default router;
