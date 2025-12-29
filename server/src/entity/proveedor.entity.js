"use strict";

import { EntitySchema } from "typeorm";
import { Entidad } from "./entidad.entity.js";
export class Proveedor extends Entidad {
    constructor() {
        super();
        this.tipo = "proveedor";
    }
}

const ProveedorSchema = new EntitySchema({
  name: "Proveedor",
  target: Proveedor,
  type: "entity-child",
  discriminatorValue: "proveedor",
  
  columns: { },

  relations: {
    lotes: {
        type: "one-to-many",
        target: "LoteRecepcion", 
        inverseSide: "proveedor",
    },
  },
});

export default ProveedorSchema;