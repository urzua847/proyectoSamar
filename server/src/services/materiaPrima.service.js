"use strict";

import { AppDataSource } from "../config/configDb.js";
import MateriaPrima from "../entity/materiaPrima.entity.js";

const materiaPrimaRepository = AppDataSource.getRepository(MateriaPrima);

export async function getMateriasPrimasService() {
  try {
    const materiasPrimas = await materiaPrimaRepository.find();
    if (!materiasPrimas || materiasPrimas.length === 0) {
      return [null, "No se encontraron materias primas"];
    }
    return [materiasPrimas, null];
  } catch (error) {
    throw new Error(error.message);
  }
}

export async function createMateriaPrimaService(data) {
  try {
    const { nombre } = data;

    const existingNombre = await materiaPrimaRepository.findOne({ where: { nombre } });
    if (existingNombre) {
      return [null, "El nombre de esta materia prima ya está registrado"];
    }

    const newMateriaPrima = materiaPrimaRepository.create(data);
    await materiaPrimaRepository.save(newMateriaPrima);
    return [newMateriaPrima, null];
  } catch (error) {
    throw new Error(error.message);
  }
}