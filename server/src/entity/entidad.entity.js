"use strict";

import { EntitySchema } from "typeorm";

export class Entidad {
    constructor() {
    }
}

const EntidadSchema = new EntitySchema({
  name: "Entidad",
  target: Entidad,      
  tableName: "entidades",
  inheritance: {
    pattern: "STI",
    column: "tipo",
  },
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
    },
    rut: {
        type: "varchar",
        length: 20,
        nullable: true,
        unique: true 
    },
    direccion: {
        type: "varchar",
        length: 255,
        nullable: true
    },
    telefono: {
        type: "varchar",
        length: 50,
        nullable: true
    },
    email: {
        type: "varchar",
        length: 100,
        nullable: true
    },
    tipo: {
        type: "varchar",
        nullable: false   
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
});

export default EntidadSchema;
