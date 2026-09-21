import { jest } from '@jest/globals';
import { mockAppDataSource, mockRepository } from './setup/typeorm.mock.js';

jest.unstable_mockModule('../config/configDb.js', () => ({
  AppDataSource: mockAppDataSource,
}));

jest.unstable_mockModule('../config/configEnv.js', () => ({
  ACCESS_TOKEN_SECRET: 'secret',
}));

jest.unstable_mockModule('../helpers/bcrypt.helper.js', () => ({
  comparePassword: jest.fn(),
  encryptPassword: jest.fn(),
}));

jest.unstable_mockModule('jsonwebtoken', () => ({
  default: {
    sign: jest.fn().mockReturnValue('mockedToken'),
  }
}));

jest.unstable_mockModule('../entity/user.entity.js', () => ({ default: class User {} }));

const { loginService, registerService } = await import('../services/auth.service.js');
const bcryptHelper = await import('../helpers/bcrypt.helper.js');

describe('Auth Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('loginService', () => {
    it('debe rechazar email incorrecto', async () => {
      mockRepository.findOne.mockResolvedValueOnce(null);
      const [result, error] = await loginService({ email: 'test@test.com', password: '123' });
      expect(result).toBeNull();
      expect(error.message).toBe('El nombre de usuario es incorrecto');
    });

    it('debe rechazar password incorrecto', async () => {
      mockRepository.findOne.mockResolvedValueOnce({ email: 'test@test.com', password: 'hash' });
      bcryptHelper.comparePassword.mockResolvedValueOnce(false);

      const [result, error] = await loginService({ email: 'test@test.com', password: 'wrong' });
      expect(result).toBeNull();
      expect(error.message).toBe('La contraseña es incorrecta');
    });

    it('debe devolver token si el login es exitoso', async () => {
      mockRepository.findOne.mockResolvedValueOnce({ 
        email: 'test@test.com', 
        password: 'hash', 
        nombreCompleto: 'Test User',
        rol: 'usuario' 
      });
      bcryptHelper.comparePassword.mockResolvedValueOnce(true);

      const [result, error] = await loginService({ email: 'test@test.com', password: 'correct' });
      expect(error).toBeNull();
      expect(result).toBe('mockedToken');
    });
  });

  describe('registerService', () => {
    it('debe rechazar si email ya existe', async () => {
      mockRepository.findOne.mockResolvedValueOnce({ email: 'test@test.com' }); // First findOne is for email
      const [result, error] = await registerService({ email: 'test@test.com' });
      expect(result).toBeNull();
      expect(error.message).toBe('Nombre de usuario en uso');
    });

    it('debe crear usuario si email y rut son unicos', async () => {
      mockRepository.findOne.mockResolvedValueOnce(null); // email
      mockRepository.findOne.mockResolvedValueOnce(null); // rut
      
      bcryptHelper.encryptPassword.mockResolvedValueOnce('hashed_pw');
      mockRepository.create.mockReturnValueOnce({ email: 'test@test.com', password: 'hashed_pw' });
      mockRepository.save.mockResolvedValueOnce({});

      const [result, error] = await registerService({ email: 'test@test.com', password: '123', rut: '1234' });
      expect(error).toBeNull();
      expect(result.email).toBe('test@test.com');
      expect(result.password).toBeUndefined(); // ensure password is removed from result
      expect(mockRepository.save).toHaveBeenCalled();
    });
  });
});
