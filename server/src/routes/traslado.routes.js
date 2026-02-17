"use strict";

import { Router } from "express";
import { createTraslado } from "../controllers/traslado.controller.js";
import { authenticateJwt } from "../middlewares/authentication.middleware.js";

const router = Router();

router.use(authenticateJwt);

router.post("/", createTraslado);

export default router;
