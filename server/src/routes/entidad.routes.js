"use strict";

import { Router } from "express";
import {
  getEntidades,
  createEntidad,
  updateEntidad,
  deleteEntidad
} from "../controllers/entidad.controller.js";
import { authenticateJwt } from "../middlewares/authentication.middleware.js";

const router = Router();

router.use(authenticateJwt);

router.get("/", getEntidades);
router.post("/", createEntidad);
router.put("/:id", updateEntidad);
router.delete("/:id", deleteEntidad);

export default router;
