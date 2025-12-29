"use strict";
import { Router } from "express";
import { createProduccionYield, getProduccionesByLote } from "../controllers/produccion.controller.js";
import { isAdmin } from "../middlewares/authorization.middleware.js";
import { authenticateJwt } from "../middlewares/authentication.middleware.js";

const router = Router();

router.use(authenticateJwt);

router.post("/", createProduccionYield);
router.get("/lote/:loteId", getProduccionesByLote);

export default router;
