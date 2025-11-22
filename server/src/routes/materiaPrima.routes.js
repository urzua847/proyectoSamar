"use strict";

import { Router } from "express";
import {
  getMateriasPrimas,
  createMateriaPrima,
} from "../controllers/materiaPrima.controller.js";
import { isAdmin, isOperarioOrAdmin } from "../middlewares/authorization.middleware.js";
import { authenticateJwt } from "../middlewares/authentication.middleware.js";

const router = Router();

router.use(authenticateJwt, isOperarioOrAdmin);

router.get("/", getMateriasPrimas);
router.post("/", createMateriaPrima);

export default router;