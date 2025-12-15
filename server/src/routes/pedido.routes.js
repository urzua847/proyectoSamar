"use strict";

import { Router } from "express";
import { createPedido, getPedidos } from "../controllers/pedido.controller.js";

const router = Router();

router.post("/", createPedido);
router.get("/", getPedidos);

export default router;
