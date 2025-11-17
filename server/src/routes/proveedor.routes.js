"use strict";

import { Router } from "express";
import {
  getProveedores,
  createProveedor,
} from "../controllers/proveedor.controller.js";

import { isAdmin } from "../middlewares/authorization.middleware.js";
import { authenticateJwt } from "../middlewares/authentication.middleware.js";

const router = Router();

router.use(authenticateJwt, isAdmin);

router.get("/", getProveedores);
router.post("/", createProveedor);

export default router;