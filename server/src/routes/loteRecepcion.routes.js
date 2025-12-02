"use strict";

import { Router } from "express";
import {
  createLote,
  getLotesActivos,
  getLote,
  updateLote,
  deleteLote
} from "../controllers/loteRecepcion.controller.js";

import { isAdmin } from "../middlewares/authorization.middleware.js";
import { isOperarioOrAdmin } from "../middlewares/authorization.middleware.js";
import { authenticateJwt } from "../middlewares/authentication.middleware.js";

const router = Router();

router.use(authenticateJwt);

router.post("/", isOperarioOrAdmin, createLote);
router.get("/activos", isOperarioOrAdmin, getLotesActivos);
router.get("/:id", isOperarioOrAdmin, getLote);
router.patch("/:id", isOperarioOrAdmin, updateLote);
router.delete("/:id", isAdmin, deleteLote);
export default router;