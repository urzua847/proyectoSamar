"use strict";
import { AppDataSource } from "../config/configDb.js";
import DefinicionProducto from "../entity/definicionProducto.entity.js";
import MateriaPrima from "../entity/materiaPrima.entity.js"; // Importamos la entidad

const productoRepository = AppDataSource.getRepository(DefinicionProducto);
const materiaPrimaRepository = AppDataSource.getRepository(MateriaPrima); // Repositorio nuevo

export async function getProductosService() {
  try {
    // Ahora incluimos la relación para ver de qué materia prima es cada producto
    const productos = await productoRepository.find({
        relations: ["materiaPrima"] 
    });
    
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
    const { nombre, materiaPrimaId, calibres } = data; 

    const existingNombre = await productoRepository.findOne({ where: { nombre } });
    if (existingNombre) {
      return [null, "El nombre de este producto ya está registrado"];
    }

    const materiaPrima = await materiaPrimaRepository.findOne({ where: { id: materiaPrimaId } });
    if (!materiaPrima) {
        return [null, "La materia prima seleccionada no existe"];
    }

    const calibresArray = calibres 
        ? calibres.split(',').map(c => c.trim()) 
        : null;

    const newProducto = productoRepository.create({
        nombre,
        materiaPrima: materiaPrima, 
        calibres: calibresArray 
    });

    await productoRepository.save(newProducto);
    return [newProducto, null];

  } catch (error) {
    throw new Error(error.message);
  }
}