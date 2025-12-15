"use strict";

import { Router } from "express";
import { createDesconcheController, getDesconcheController, getAllDesconchesController, deleteDesconcheController, updateDesconcheController } from "../controllers/desconche.controller.js";

const router = Router();

// /api/desconche
router.get("/", getAllDesconchesController);
router.post("/:loteId", createDesconcheController);
router.get("/:loteId", getDesconcheController);
router.delete("/:id", deleteDesconcheController);
router.put("/:id", updateDesconcheController);

export default router;
