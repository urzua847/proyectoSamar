"use strict";
import { Router } from "express";
import authRoutes from "./auth.routes.js";
import userRoutes from "./user.routes.js";
import proveedorRoutes from "./proveedor.routes.js";
import materiaPrimaRoutes from "./materiaPrima.routes.js";
import productoRoutes from "./definicionProducto.routes.js";
import loteRecepcionRoutes from "./loteRecepcion.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/user", userRoutes);
router.use("/proveedores", proveedorRoutes);
router.use("/materiasPrimas", materiaPrimaRoutes);
router.use("/productos", productoRoutes);
router.use("/recepcion", loteRecepcionRoutes);


export default router;