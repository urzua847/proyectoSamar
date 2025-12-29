"use strict";

import { Router } from "express";
import {
  getMateriasPrimas,
  createMateriaPrima,
  updateMateriaPrima,
  deleteMateriaPrima
} from "../controllers/materiaPrima.controller.js";
import { isAdmin, isOperarioOrAdmin } from "../middlewares/authorization.middleware.js";
import { authenticateJwt } from "../middlewares/authentication.middleware.js";

const router = Router();

router.use(authenticateJwt, isOperarioOrAdmin);

router.get("/", getMateriasPrimas);
router.post("/", createMateriaPrima);
router.put("/:id", updateMateriaPrima);
router.delete("/:id", deleteMateriaPrima);

export default router;