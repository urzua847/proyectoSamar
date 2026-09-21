"use strict";

import { Router } from "express";
import { createTraslado, trasladoPorScan } from "../controllers/traslado.controller.js";
import { authenticateJwt } from "../middlewares/authentication.middleware.js";
import { isOperarioOrAdminOrControl } from "../middlewares/authorization.middleware.js";
import { validateRequest } from "../middlewares/validation.middleware.js";
import { createTrasladoSchema } from "../validations/produccion.schema.js";

const router = Router();

router.use(authenticateJwt);

router.post("/", isOperarioOrAdminOrControl, validateRequest(createTrasladoSchema), createTraslado);
router.post("/scan", isOperarioOrAdminOrControl, trasladoPorScan);

export default router;
