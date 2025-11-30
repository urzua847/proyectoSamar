"use strict";

import { AppDataSource } from "../config/configDb.js";
import Ubicacion from "../entity/ubicacion.entity.js";

const ubicacionRepository = AppDataSource.getRepository(Ubicacion);

export async function getUbicacionesService() {
  try {
    const ubicaciones = await ubicacionRepository.find();
    if (!ubicaciones || ubicaciones.length === 0) return [null, "No hay ubicaciones"];
    return [ubicaciones, null];
  } catch (error) { throw new Error(error.message); }
}

export async function createUbicacionService(data) {
  try {
    const { nombre } = data;
    const existing = await ubicacionRepository.findOne({ where: { nombre } });
    if (existing) return [null, "La ubicación ya existe"];
    
    const newUbicacion = ubicacionRepository.create(data);
    await ubicacionRepository.save(newUbicacion);
    return [newUbicacion, null];
  } catch (error) { throw new Error(error.message); }
}