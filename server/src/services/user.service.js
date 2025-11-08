"use strict";
import User from "../entity/user.entity.js";
import { AppDataSource } from "../config/configDb.js";
import { encryptPassword } from "../helpers/bcrypt.helper.js";

export async function getUserService(query) {
  try {
    const { rut, id, email } = query;
    const userRepository = AppDataSource.getRepository(User);
    const userFound = await userRepository.findOne({
      where: [{ id: id }, { rut: rut }, { email: email }],
    });

    if (!userFound) return [null, "Usuario no encontrado"];
    const { password, ...userData } = userFound;
    return [userData, null];
  } catch (error) {
    return [null, "Error interno del servidor"];
  }
}

export async function getUsersService() {
  try {
    const userRepository = AppDataSource.getRepository(User);
    const users = await userRepository.find();
    if (!users || users.length === 0) return [null, "No hay usuarios"];
    const usersData = users.map(({ password, ...user }) => user);
    return [usersData, null];
  } catch (error) {
    return [null, "Error interno del servidor"];
  }
}

export async function updateUserService(query, body) {
  try {
    const { rut } = query;
    const userRepository = AppDataSource.getRepository(User);
    const userFound = await userRepository.findOne({ where: { rut } });

    if (!userFound) return [null, "Usuario no encontrado"];

    const dataToUpdate = { ...body };

    if (body.newPassword && body.newPassword.trim() !== "") {
      dataToUpdate.password = await encryptPassword(body.newPassword);
      delete dataToUpdate.newPassword;
    }

    await userRepository.update({ id: userFound.id }, dataToUpdate);
    const updatedUser = await userRepository.findOne({ where: { id: userFound.id } });

    const { password, ...userUpdatedData } = updatedUser;
    return [userUpdatedData, null];
  } catch (error) {
    return [null, "Error interno del servidor"];
  }
}

export async function deleteUserService(query) {
  try {
    const { rut } = query;
    const userRepository = AppDataSource.getRepository(User);
    const userFound = await userRepository.findOne({ where: { rut } });

    if (!userFound) return [null, "Usuario no encontrado"];
    if (userFound.rol === "administrador") {
      return [null, "No se puede eliminar a un administrador"];
    }

    await userRepository.remove(userFound);
    const { password, ...dataUser } = userFound;
    return [dataUser, null];
  } catch (error) {
    return [null, "Error interno del servidor"];
  }
}
