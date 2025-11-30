"use strict";

import { Router } from "express";
import { getUbicaciones, createUbicacion } from "../controllers/ubicacion.controller.js";
import { isAdmin, isOperarioOrAdmin } from "../middlewares/authorization.middleware.js";
import { authenticateJwt } from "../middlewares/authentication.middleware.js";

const router = Router();
router.use(authenticateJwt);

router.get("/", isOperarioOrAdmin, getUbicaciones); // Operario necesita verlas
router.post("/", isAdmin, createUbicacion); // Solo admin crea

export default router;