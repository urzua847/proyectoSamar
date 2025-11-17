"use strict";

import { Router } from "express";
import {
  getProductos,
  createProducto,
} from "../controllers/definicionProducto.controller.js";
import { isAdmin } from "../middlewares/authorization.middleware.js";
import { authenticateJwt } from "../middlewares/authentication.middleware.js";

const router = Router();

router.use(authenticateJwt, isAdmin);

router.get("/", getProductos);
router.post("/", createProducto);

export default router;