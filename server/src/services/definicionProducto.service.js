"use strict";

import { AppDataSource } from "../config/configDb.js";
import DefinicionProducto from "../entity/definicionProducto.entity.js";

const productoRepository = AppDataSource.getRepository(DefinicionProducto);

export async function getProductosService() {
  try {
    const productos = await productoRepository.find();
    if (!productos || productos.length === 0) {
      return [null, "No se encontraron productos definidos"];
    }
    return [productos, null];
  } catch (error) {
    throw new Error(error.message);
  }
}

export async function createProductoService(data) {
  try {
    const { nombre } = data;

    const existingNombre = await productoRepository.findOne({ where: { nombre } });
    if (existingNombre) {
      return [null, "El nombre de este producto ya está registrado"];
    }

    const newProducto = productoRepository.create(data);
    await productoRepository.save(newProducto);
    return [newProducto, null];
  } catch (error) {
    throw new Error(error.message);
  }
}