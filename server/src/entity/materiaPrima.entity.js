"use strict";

import { EntitySchema } from "typeorm";

const MateriaPrimaSchema = new EntitySchema({
  name: "MateriaPrima",
  tableName: "materias_primas",
  columns: {
    id: { 
        type: "int", 
        primary: true, 
        generated: true 
    },
    nombre: { 
        type: "varchar", 
        length: 100, 
        nullable: false, 
        unique: true 
    },
    createdAt: { 
        type: "timestamp with time zone", 
        default: () => "CURRENT_TIMESTAMP" },
  },
  relations: {
    lotes: {
        type: "one-to-many",
        target: "LoteRecepcion",
        inverseSide: "materiaPrima",
    },
  },
});

export default MateriaPrimaSchema;