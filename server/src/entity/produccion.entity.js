"use strict";

import { EntitySchema } from "typeorm";

const ProduccionSchema = new EntitySchema({
  name: "Produccion",
  tableName: "producciones",
  columns: {
    id: {
      type: "int",
      primary: true,
      generated: true,
    },
    peso_carne_blanca: {
      type: "decimal",
      precision: 10,
      scale: 2,
      nullable: false,
      default: 0
    },
    peso_pinzas: {
      type: "decimal",
      precision: 10,
      scale: 2,
      nullable: false, 
      default: 0
    },
    peso_total: {
      type: "decimal",
      precision: 10,
      scale: 2,
      nullable: false,
    },
    observacion: {
      type: "text",
      nullable: true,
    },
    fecha_produccion: {
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
    loteRecepcion: {
      type: "many-to-one",
      target: "LoteRecepcion",
      inverseSide: "producciones",
      nullable: false,
    },
  },
});

export default ProduccionSchema;
