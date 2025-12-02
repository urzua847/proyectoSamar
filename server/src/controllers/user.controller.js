"use strict";
import {
  deleteUserService,
  getUserService,
  getUsersService,
  updateUserService,
  createUserService
} from "../services/user.service.js";
import { userBodyValidation, userQueryValidation, createUserValidation } from "../validations/user.validation.js";
import { handleErrorClient, handleErrorServer, handleSuccess } from "../handlers/responseHandlers.js";

export async function createUser(req, res) {
    try {
        const { body } = req;
        const { error } = createUserValidation.validate(body);
        if (error) return handleErrorClient(res, 400, "Error de validación", error.message);

        const [user, errorUser] = await createUserService(body);
        if (errorUser) return handleErrorClient(res, 400, "Error al crear usuario", errorUser);

        handleSuccess(res, 201, "Usuario creado exitosamente", user);
    } catch (error) {
        handleErrorServer(res, 500, error.message);
    }
}

export async function getUsers(req, res) {
  try {
    const [users, errorUsers] = await getUsersService();
    if (errorUsers) return handleErrorClient(res, 404, errorUsers);
    handleSuccess(res, 200, "Usuarios encontrados", users);
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}

export async function updateUser(req, res) {
    try {
      const { rut } = req.query;
      const { body } = req;

      const { error: queryError } = userQueryValidation.validate({ rut });
      if (queryError) return handleErrorClient(res, 400, "Error en la consulta", queryError.message);

      const { error: bodyError } = userBodyValidation.validate(body);
      if (bodyError) return handleErrorClient(res, 400, "Error en los datos", bodyError.message);

      const [user, userError] = await updateUserService({ rut }, body);
      if (userError) return handleErrorClient(res, 400, "Error al modificar", userError);

      handleSuccess(res, 200, "Usuario modificado", user);
    } catch (error) {
      handleErrorServer(res, 500, error.message);
    }
  }

  export async function deleteUser(req, res) {
    try {
      const { rut } = req.query;
      const { error } = userQueryValidation.validate({ rut });
      if (error) return handleErrorClient(res, 400, "Error en la consulta", error.message);

      const [user, errorUser] = await deleteUserService({ rut });
      if (errorUser) return handleErrorClient(res, 404, "Error al eliminar", errorUser);

      handleSuccess(res, 200, "Usuario eliminado", user);
    } catch (error) {
      handleErrorServer(res, 500, error.message);
    }
  }