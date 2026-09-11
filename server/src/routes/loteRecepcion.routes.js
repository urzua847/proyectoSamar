"use strict";

import { Router } from "express";
import {
  createLote,
  getLotesActivos,
  getRecepcionesByEntidad,
  getRecepciones,
  getLote,
  updateLote,
  deleteLote,
  restoreLote
} from "../controllers/loteRecepcion.controller.js";

import { isAdmin } from "../middlewares/authorization.middleware.js";
import { isOperarioOrAdmin } from "../middlewares/authorization.middleware.js";
import { authenticateJwt } from "../middlewares/authentication.middleware.js";

const router = Router();

router.use(authenticateJwt);

router.post("/", isOperarioOrAdmin, createLote);
router.get("/", isOperarioOrAdmin, getRecepciones);
router.get("/entidad/:entidadId", isOperarioOrAdmin, getRecepcionesByEntidad);
router.get("/activos", isOperarioOrAdmin, getLotesActivos);
router.get("/:id", isOperarioOrAdmin, getLote);
router.patch("/:id", isOperarioOrAdmin, updateLote);
router.delete("/:id", isAdmin, deleteLote);
router.post("/restore/:id", isAdmin, restoreLote);  // ← Nueva ruta de restauración

export default router;

