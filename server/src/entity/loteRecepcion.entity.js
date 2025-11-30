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
    },
    peso_bruto_kg: {
      type: "decimal",
      precision: 10,
      scale: 2,
      nullable: false,
    },
    detalle_pesadas:{
      type: "simple-array",
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