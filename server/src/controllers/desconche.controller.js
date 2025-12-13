"use strict";

import { createDesconche, getDesconcheByLote, getAllDesconches } from "../services/desconche.service.js";

export async function createDesconcheController(req, res) {
  try {
    const { loteId } = req.params;
    const data = req.body;
    
    const newDesconche = await createDesconche(loteId, data);
    
    res.status(201).json({
      status: "success",
      message: "Desconche registrado exitosamente",
      data: newDesconche,
    });
  } catch (error) {
    console.error("Error en createDesconcheController:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
}

export async function getDesconcheController(req, res) {
  try {
    const { loteId } = req.params;
    
    const desconche = await getDesconcheByLote(loteId);
    
    if (!desconche) {
        return res.status(404).json({
            status: "error",
            message: "No hay desconche registrado para este lote"
        });
    }

    res.status(200).json({
      status: "success",
      data: desconche,
    });
  } catch (error) {
    console.error("Error en getDesconcheController:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
}

export async function getAllDesconchesController(req, res) {
  try {
    const desconches = await getAllDesconches();
    res.status(200).json({
      status: "success",
      data: desconches,
    });
  } catch (error) {
    console.error("Error en getAllDesconchesController:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
}
