"use strict";

import { Router } from "express";
import { createDesconcheController, getDesconcheController, getAllDesconchesController } from "../controllers/desconche.controller.js";

const router = Router();

// /api/desconche
router.get("/", getAllDesconchesController);
router.post("/:loteId", createDesconcheController);
router.get("/:loteId", getDesconcheController);

export default router;
