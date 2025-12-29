"use strict";

import { EntitySchema } from "typeorm";
import { Entidad } from "./entidad.entity.js";
export class Cliente extends Entidad {
    constructor() {
        super();
        this.tipo = "cliente";
    }
}

const ClienteSchema = new EntitySchema({
  name: "Cliente",
  target: Cliente,
  type: "entity-child",
  discriminatorValue: "cliente", 
  
  columns: { }
});

export default ClienteSchema;
