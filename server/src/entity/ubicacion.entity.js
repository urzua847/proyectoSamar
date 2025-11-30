"use strict";

import { EntitySchema } from "typeorm";

const UbicacionSchema = new EntitySchema({
  name: "Ubicacion",
  tableName: "ubicaciones",
  columns: {
    id: {
      type: "int",
      primary: true,
      generated: true,
    },
    nombre: {
      type: "varchar",
      length: 100,
      nullable: false,
      unique: true, // Ej: "Cámara 1"
    },
    tipo: {
      type: "enum",
      enum: ["camara", "contenedor"], // Para diferenciarlas
      nullable: false,
    },
    createdAt: {
      type: "timestamp with time zone",
      default: () => "CURRENT_TIMESTAMP",
    },
  },
  relations: {
    productos: {
        type: "one-to-many",
        target: "ProductoTerminado",
        inverseSide: "ubicacion",
    },
  },
});

export default UbicacionSchema;