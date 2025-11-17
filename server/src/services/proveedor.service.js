"use strict";

import { AppDataSource } from "../config/configDb.js";
import Proveedor from "../entity/proveedor.entity.js";

const proveedorRepository = AppDataSource.getRepository(Proveedor);


export async function getProveedoresService() {
  try {
    const proveedores = await proveedorRepository.find();
    if (!proveedores || proveedores.length === 0) {
      return [null, "No se encontraron proveedores"];
    }
    return [proveedores, null];
  } catch (error) {
    throw new Error(error.message);
  }
}


export async function createProveedorService(data) {
  try {
    const { nombre } = data;

    const existingNombre = await proveedorRepository.findOne({ where: { nombre } });
    if (existingNombre) {
      return [null, "El nombre de este proveedor ya está registrado"];
    }

    const newProveedor = proveedorRepository.create(data);
    await proveedorRepository.save(newProveedor);
    return [newProveedor, null];
  } catch (error) {
    throw new Error(error.message);
  }
}