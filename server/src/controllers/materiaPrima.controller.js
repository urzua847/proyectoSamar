"use strict";

import {
  getMateriasPrimasService,
  createMateriaPrimaService,
} from "../services/materiaPrima.service.js";
import { createMateriaPrimaValidation } from "../validations/materiaPrima.validation.js";
import {
  handleErrorClient,
  handleErrorServer,
  handleSuccess,
} from "../handlers/responseHandlers.js";

export async function getMateriasPrimas(req, res) {
  try {
    const [materiasPrimas, error] = await getMateriasPrimasService();
    if (error) return handleErrorClient(res, 404, error);
    handleSuccess(res, 200, "Materias primas encontradas", materiasPrimas);
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}

export async function createMateriaPrima(req, res) {
  try {
    const { body } = req;

    const { error: validationError } = createMateriaPrimaValidation.validate(body);
    if (validationError) {
      return handleErrorClient(res, 400, "Error de validación", validationError.message);
    }

    const [newMateriaPrima, error] = await createMateriaPrimaService(body);
    if (error) return handleErrorClient(res, 400, "Error al crear materia prima", error);

    handleSuccess(res, 201, "Materia prima creada exitosamente", newMateriaPrima);
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}