"use strict";

import { EntitySchema } from "typeorm";

const DesconcheSchema = new EntitySchema({
  name: "Desconche",
  tableName: "desconches",
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
    },
    peso_pinzas: {
      type: "decimal",
      precision: 10,
      scale: 2,
      nullable: false,
    },
    peso_total: {
      type: "decimal",
      precision: 10,
      scale: 2,
      nullable: true, 
    },
    observacion: {
      type: "text",
      nullable: true,
    },
    porcentaje_rendimiento: {
      type: "decimal",
      precision: 5,
      scale: 2,
      nullable: true,
    },
    createdAt: {
      type: "timestamp with time zone",
      default: () => "CURRENT_TIMESTAMP",
    },
  },
  relations: {
    lote: {
      type: "one-to-one",
      target: "LoteRecepcion",
      joinColumn: true, 
      nullable: false,
      inverseSide: "desconche",
    },
  },
});

export default DesconcheSchema;
