"use strict";

import { EntitySchema } from "typeorm";

const LoteRecepcionSchema = new EntitySchema({
  name: "LoteRecepcion",
  tableName: "lotes_recepcion",
  columns: {
    id: {
      type: "int",
      primary: true,
      generated: true,
    },
    codigo: {
      type: "varchar",
      length: 20,
      nullable: false,
      unique: true,
    },
    peso_bruto_kg: {
      type: "decimal",
      precision: 10,
      scale: 2,
      nullable: false,
    },
    peso_actual: {
      type: "decimal",
      precision: 10,
      scale: 2,
      nullable: true, 
    },
    detalle_pesadas:{
      type: "simple-json", // Stores array of objects: [{ cajas: 10, kilos: 100 }, ...]
      nullable: true,
    },
    numero_bandejas: {
      type: "int",
      nullable: false,
    },
    fecha_recepcion: {
      type: "timestamp with time zone",
      default: () => "CURRENT_TIMESTAMP",
    },
    estado: {
      type: "boolean",
      default: true, // true = Abierto, false = Cerrado
    },
    createdAt: {
      type: "timestamp with time zone",
      default: () => "CURRENT_TIMESTAMP",
    },
    updatedAt: {
      type: "timestamp with time zone",
      default: () => "CURRENT_TIMESTAMP",
      onUpdate: "CURRENT_TIMESTAMP",
    },
  },
  relations: {
    proveedor: {
      type: "many-to-one",
      target: "Proveedor",
      inverseSide: "lotes",
      nullable: false, 
    },
    materiaPrima: {
      type: "many-to-one",
      target: "MateriaPrima",
      inverseSide: "lotes",
      nullable: false,
    },
    operario: {
      type: "many-to-one",
      target: "User",
      nullable: false, 
    },
    productosTerminados: {
        type: "one-to-many",
        target: "ProductoTerminado",
        inverseSide: "loteDeOrigen",
    }
  },
});

export default LoteRecepcionSchema;