"use strict";

import { Router } from "express";
import { createTraslado, trasladoPorScan } from "../controllers/traslado.controller.js";
import { authenticateJwt } from "../middlewares/authentication.middleware.js";
import { validateRequest } from "../middlewares/validation.middleware.js";
import { createTrasladoSchema } from "../validations/produccion.schema.js";

const router = Router();

router.use(authenticateJwt);

router.post("/", validateRequest(createTrasladoSchema), createTraslado);
router.post("/scan", trasladoPorScan);

export default router;
