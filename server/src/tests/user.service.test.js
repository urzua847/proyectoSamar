import { jest } from '@jest/globals';
import { mockAppDataSource, mockRepository } from './setup/typeorm.mock.js';

jest.unstable_mockModule('../config/configDb.js', () => ({
  AppDataSource: mockAppDataSource,
}));

jest.unstable_mockModule('../helpers/bcrypt.helper.js', () => ({
  encryptPassword: jest.fn().mockResolvedValue('hashed_pw'),
}));

jest.unstable_mockModule('../entity/user.entity.js', () => ({ default: class User {} }));

const { createUserService, getUserService, getUsersService, updateUserService, deleteUserService } = await import('../services/user.service.js');

describe('User Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createUserService', () => {
    it('debe rechazar si email o rut ya existen', async () => {
      mockRepository.findOne.mockResolvedValueOnce({ id: 1 });
      const [result, error] = await createUserService({ email: 'test@test.com' });
      expect(result).toBeNull();
      expect(error).toBe('El usuario ya existe (RUT o Username duplicado)');
    });

    it('debe crear usuario exitosamente', async () => {
      mockRepository.findOne.mockResolvedValueOnce(null);
      mockRepository.create.mockReturnValueOnce({ email: 'test@test.com', password: 'pw' });
      
      const [result, error] = await createUserService({ email: 'test@test.com', password: '123' });
      expect(error).toBeNull();
      expect(result.password).toBeUndefined(); // check password removed
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('debe capturar error de base de datos', async () => {
      mockRepository.findOne.mockRejectedValue(new Error('DB Error'));
      const [result, error] = await createUserService({ email: 'test@test.com' });
      expect(result).toBeNull();
      expect(error).toBe('Error interno del servidor');
    });
  });

  describe('getUserService', () => {
    it('debe retornar usuario si existe y remover password', async () => {
      mockRepository.findOne.mockResolvedValueOnce({ id: 1, password: 'pw', email: 'test@test.com' });
      const [result, error] = await getUserService({ id: 1 });
      expect(error).toBeNull();
      expect(result.password).toBeUndefined();
      expect(result.email).toBe('test@test.com');
    });

    it('debe retornar error si no existe', async () => {
      mockRepository.findOne.mockResolvedValueOnce(null);
      const [result, error] = await getUserService({ id: 99 });
      expect(result).toBeNull();
      expect(error).toBe('Usuario no encontrado');
    });

    it('debe capturar error de base de datos', async () => {
      mockRepository.findOne.mockRejectedValue(new Error('DB Error'));
      const [result, error] = await getUserService({ id: 1 });
      expect(result).toBeNull();
      expect(error).toBe('Error interno del servidor');
    });
  });

  describe('getUsersService', () => {
    it('debe retornar usuarios y remover passwords', async () => {
      mockRepository.find.mockResolvedValueOnce([{ id: 1, password: 'pw' }, { id: 2, password: 'pw2' }]);
      const [result, error] = await getUsersService();
      expect(error).toBeNull();
      expect(result.length).toBe(2);
      expect(result[0].password).toBeUndefined();
    });

    it('debe retornar error si no hay usuarios', async () => {
      mockRepository.find.mockResolvedValueOnce([]);
      const [result, error] = await getUsersService();
      expect(result).toBeNull();
      expect(error).toBe('No hay usuarios');
    });

    it('debe capturar error de base de datos', async () => {
      mockRepository.find.mockRejectedValue(new Error('DB Error'));
      const [result, error] = await getUsersService();
      expect(result).toBeNull();
      expect(error).toBe('Error interno del servidor');
    });
  });

  describe('updateUserService', () => {
    it('debe encriptar nuevo password si se envia', async () => {
      const mockUser = { id: 1, rut: '123' };
      mockRepository.findOne
        .mockResolvedValueOnce(mockUser) // User found
        .mockResolvedValueOnce({ ...mockUser, password: 'hashed_pw' }); // Updated user

      const [result, error] = await updateUserService({ rut: '123' }, { newPassword: 'new123' });
      expect(error).toBeNull();
      expect(mockRepository.update).toHaveBeenCalledWith(
        { id: 1 },
        expect.objectContaining({ password: 'hashed_pw' })
      );
      expect(result.password).toBeUndefined();
    });

    it('debe retornar error si no existe', async () => {
      mockRepository.findOne.mockResolvedValueOnce(null);
      const [result, error] = await updateUserService({ rut: '123' }, { newPassword: 'new' });
      expect(result).toBeNull();
      expect(error).toBe('Usuario no encontrado');
    });

    it('debe capturar error de base de datos', async () => {
      mockRepository.findOne.mockRejectedValue(new Error('DB Error'));
      const [result, error] = await updateUserService({ rut: '123' }, {});
      expect(result).toBeNull();
      expect(error).toBe('Error interno del servidor');
    });
  });

  describe('deleteUserService', () => {
    it('debe rechazar si intenta eliminar a un administrador', async () => {
      mockRepository.findOne.mockResolvedValueOnce({ id: 1, rol: 'administrador' });
      const [result, error] = await deleteUserService({ rut: '123' });
      expect(result).toBeNull();
      expect(error).toBe('No se puede eliminar a un administrador');
    });

    it('debe eliminar exitosamente un usuario', async () => {
      const mockUser = { id: 1, rol: 'usuario', password: 'pw' };
      mockRepository.findOne.mockResolvedValueOnce(mockUser);
      
      const [result, error] = await deleteUserService({ rut: '123' });
      expect(error).toBeNull();
      expect(result.password).toBeUndefined();
      expect(mockRepository.remove).toHaveBeenCalledWith(mockUser);
    });

    it('debe retornar error si no existe', async () => {
      mockRepository.findOne.mockResolvedValueOnce(null);
      const [result, error] = await deleteUserService({ rut: '123' });
      expect(result).toBeNull();
      expect(error).toBe('Usuario no encontrado');
    });

    it('debe capturar error de base de datos', async () => {
      mockRepository.findOne.mockRejectedValue(new Error('DB Error'));
      const [result, error] = await deleteUserService({ rut: '123' });
      expect(result).toBeNull();
      expect(error).toBe('Error interno del servidor');
    });
  });
});
