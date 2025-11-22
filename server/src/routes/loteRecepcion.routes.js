"use strict";

import { Router } from "express";
import {
  createLote,
  getLotesActivos
} from "../controllers/loteRecepcion.controller.js";

import { isOperarioOrAdmin } from "../middlewares/authorization.middleware.js";
import { authenticateJwt } from "../middlewares/authentication.middleware.js";

const router = Router();

router.use(authenticateJwt);

router.post("/", isOperarioOrAdmin, createLote);
router.get("/activos", isOperarioOrAdmin, getLotesActivos);

export default router;