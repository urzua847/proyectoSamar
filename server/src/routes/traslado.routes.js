"use strict";

import { Router } from "express";
import { createTraslado } from "../controllers/traslado.controller.js";

const router = Router();

router.post("/", createTraslado);

export default router;
