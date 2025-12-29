"use strict";
import { AppDataSource } from "../config/configDb.js";
import DefinicionProducto from "../entity/definicionProducto.entity.js";
import MateriaPrima from "../entity/materiaPrima.entity.js"; 

const productoRepository = AppDataSource.getRepository(DefinicionProducto);
const materiaPrimaRepository = AppDataSource.getRepository(MateriaPrima); 

export async function getProductosService() {
  try {
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
    const { nombre, materiaPrimaId, calibres, tipo, origen } = data; 

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
        tipo,
        origen,
        materiaPrima: materiaPrima, 
        calibres: calibresArray 
    });

    await productoRepository.save(newProducto);
    return [newProducto, null];

  } catch (error) {
    throw new Error(error.message);
  }
}

export async function updateProductoService(id, data) {
  try {
    const { nombre, tipo, origen, calibres } = data; 
    
    const producto = await productoRepository.findOne({ where: { id } });
    if (!producto) return [null, "Producto no encontrado"];

    if (nombre) producto.nombre = nombre;
    if (tipo) producto.tipo = tipo; 
    if (origen) producto.origen = origen; 

    if (calibres !== undefined) {
        if (Array.isArray(calibres)) {
            producto.calibres = calibres;
        } else if (typeof calibres === 'string') {
             producto.calibres = calibres.split(',').map(c => c.trim()).filter(Boolean);
        } else {
            producto.calibres = null; 
        }
    }

    await productoRepository.save(producto);
    return [producto, null];
  } catch (error) {
    console.error("Error updateProductoService:", error);
    return [null, error.message];
  }
}

export async function deleteProductoService(id) {
  try {
    const producto = await productoRepository.findOne({ where: { id } });
    if (!producto) return [null, "Producto no encontrado"];

    await productoRepository.remove(producto);
    return [true, null];
  } catch (error) {
    console.error("Error deleteProductoService:", error);
    if (error.code === '23503') { 
        return [null, "No se puede eliminar: El producto está siendo utilizado en producciones o existencias."];
    }
    return [null, error.message];
  }
}