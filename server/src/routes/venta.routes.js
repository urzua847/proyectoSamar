"use strict";

import { Router } from "express";
import { createVenta, getVentas } from "../controllers/venta.controller.js";
import { authenticateJwt } from "../middlewares/authentication.middleware.js";

const router = Router();
router.use(authenticateJwt);

router.post("/", createVenta);
router.get("/", getVentas);

export default router;
