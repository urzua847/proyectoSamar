"use strict";
import { AppDataSource } from "../config/configDb.js";
import Entidad from "../entity/entidad.entity.js";

const entidadRepository = AppDataSource.getRepository(Entidad);

export async function getEntidadesService(tipo) {
  try {
    const where = {};
    if (tipo) {
        where.tipo = tipo; // 'cliente' | 'proveedor'
    }

    const entidades = await entidadRepository.find({ where, order: { nombre: 'ASC' } });
    if (!entidades || entidades.length === 0) {
      return [null, "No se encontraron entidades"];
    }
    return [entidades, null];
  } catch (error) {
    throw new Error(error.message);
  }
}

export async function createEntidadService(data, discriminator) {
    try {
        const { nombre, rut } = data;
        
        const existing = await entidadRepository.findOne({ where: [{ nombre }, { rut }] });
        if (existing) return [null, "La entidad ya existe (Nombre o RUT duplicado)"];

        const newEntidad = entidadRepository.create({ ...data, tipo: discriminator });
        await entidadRepository.save(newEntidad);
        
        return [newEntidad, null];

    } catch (error) {
        throw new Error(error.message);
    }
}

export async function updateEntidadService(id, data) {
    try {
        const entidad = await entidadRepository.findOne({ where: { id } });
        if (!entidad) return [null, "Entidad no encontrada"];

        entidadRepository.merge(entidad, data);
        await entidadRepository.save(entidad);
        
        return [entidad, null];
    } catch (error) {
        throw new Error(error.message);
    }
}

export async function deleteEntidadService(id) {
    try {
        const entidad = await entidadRepository.findOne({ where: { id } });
        if (!entidad) return [null, "Entidad no encontrada"];

        await entidadRepository.remove(entidad);
        return [true, null];
    } catch (error) {
        return [null, error.message];
    }
}
