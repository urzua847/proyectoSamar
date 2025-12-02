"use strict";
import { Router } from "express";
import { isAdmin } from "../middlewares/authorization.middleware.js";
import { authenticateJwt } from "../middlewares/authentication.middleware.js";
import { deleteUser, getUsers, updateUser } from "../controllers/user.controller.js";
import { createUser } from "../controllers/user.controller.js";

const router = Router();

router.use(authenticateJwt, isAdmin);

router.post("/", createUser);
router.get("/", getUsers);
router.patch("/detail", updateUser);
router.delete("/detail", deleteUser);

export default router;