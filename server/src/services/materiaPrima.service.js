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

export async function updateMateriaPrimaService(id, data) {
  try {
    const materiaPrima = await materiaPrimaRepository.findOne({ where: { id } });
    if (!materiaPrima) return [null, "Materia Prima no encontrada"];

    materiaPrimaRepository.merge(materiaPrima, data);
    await materiaPrimaRepository.save(materiaPrima);
    return [materiaPrima, null];
  } catch (error) {
    throw new Error(error.message);
  }
}

export async function deleteMateriaPrimaService(id) {
  try {
    const result = await materiaPrimaRepository.delete(id);
    if (result.affected === 0) return [null, "Materia Prima no encontrada"];
    return [true, null];
  } catch (error) {
    if (error.code === '23503') return [null, "No se puede eliminar: Existen productos asociados a esta Materia Prima"];
    throw new Error(error.message);
  }
}