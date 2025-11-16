"use strict";

import { EntitySchema } from "typeorm";

const DefinicionProductoSchema = new EntitySchema({
  name: "DefinicionProducto",
  tableName: "definiciones_producto",
  columns: {
    id: {
      type: "int",
      primary: true,
      generated: true,
    },
    nombre: {
      type: "varchar",
      length: 255,
      nullable: false,
      unique: true,
    },
    categoria: {
      type: "varchar",
      length: 100,
      nullable: true, 
    },
    createdAt: {
      type: "timestamp with time zone",
      default: () => "CURRENT_TIMESTAMP",
    },
  },
  relations: {
    productosTerminados: {
        type: "one-to-many",
        target: "ProductoTerminado",
        inverseSide: "definicion",
    },
  },
});

export default DefinicionProductoSchema;