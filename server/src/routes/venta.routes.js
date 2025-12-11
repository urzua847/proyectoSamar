"use strict";

import { Router } from "express";
import { createVenta, getVentas } from "../controllers/venta.controller.js";

const router = Router();

router.post("/", createVenta);
router.get("/", getVentas);

export default router;
