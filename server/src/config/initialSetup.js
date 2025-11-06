
"use strict";
import User from "../entity/user.entity.js";
import { AppDataSource } from "./configDb.js";
import { encryptPassword } from "../helpers/bcrypt.helper.js";

export async function createUsers() {
  try {
    const userRepository = AppDataSource.getRepository(User);
    const count = await userRepository.count();
    if (count > 0) {
        console.log("La base de datos ya tiene usuarios. No se crearán nuevos.");
        return;
    }

    await Promise.all([
      userRepository.save(
        userRepository.create({
          nombreCompleto: "Admin",
          rut: "11111111-1",
          email: "admin@correo.com",
          password: await encryptPassword("admin123"),
          rol: "administrador",
        }),
      ),
      userRepository.save(
        userRepository.create({
          nombreCompleto: "Usuario1",
          rut: "12345678-9",
          email: "usuario1@correo.com",
          password: await encryptPassword("user123"),
          rol: "usuario",
        })
      ),
    ]);
    console.log("Usuarios iniciales creados exitosamente");
  } catch (error) {
    console.error("Error al crear usuarios iniciales:", error);
  }
}