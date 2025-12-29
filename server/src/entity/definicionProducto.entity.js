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
    tipo: {
      type: "enum",
      enum: ["primario", "elaborado"],
      default: "elaborado",
      nullable: false,
    },
    origen: {
      type: "varchar",  
      length: 50,
      nullable: true
    },
    calibres: {
      type: "simple-array",
      nullable: true
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
    materiaPrima: {
        type: "many-to-one",
        target: "MateriaPrima",
        joinColumn: { name: "materiaPrimaId" }, 
        nullable: false 
    }
  },
});

export default DefinicionProductoSchema;