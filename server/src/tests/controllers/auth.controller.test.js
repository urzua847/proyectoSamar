import { jest } from '@jest/globals';

jest.unstable_mockModule('../../services/auth.service.js', () => ({
  loginService: jest.fn(),
  registerService: jest.fn(),
}));

jest.unstable_mockModule('../../validations/auth.validation.js', () => ({
  authValidation: { validate: jest.fn() },
  registerValidation: { validate: jest.fn() },
}));

jest.unstable_mockModule('../../handlers/responseHandlers.js', () => ({
  handleErrorClient: jest.fn(),
  handleErrorServer: jest.fn(),
  handleSuccess: jest.fn(),
}));

const { loginService, registerService } = await import('../../services/auth.service.js');
const { authValidation, registerValidation } = await import('../../validations/auth.validation.js');
const { handleErrorClient, handleErrorServer, handleSuccess } = await import('../../handlers/responseHandlers.js');
const { login, register, logout } = await import('../../controllers/auth.controller.js');

describe('Auth Controller', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { body: {} };
    res = {
      cookie: jest.fn(),
      clearCookie: jest.fn(),
    };
  });

  describe('login', () => {
    it('debe devolver error de validacion', async () => {
      authValidation.validate.mockReturnValue({ error: { message: 'Invalid format' } });
      
      await login(req, res);
      
      expect(handleErrorClient).toHaveBeenCalledWith(res, 400, 'Error de validación', 'Invalid format');
    });

    it('debe devolver error de servicio de login', async () => {
      authValidation.validate.mockReturnValue({ error: null });
      loginService.mockResolvedValue([null, 'User not found']);
      
      await login(req, res);
      
      expect(handleErrorClient).toHaveBeenCalledWith(res, 400, 'Error iniciando sesión', 'User not found');
    });

    it('debe loguear exitosamente y setear cookie', async () => {
      authValidation.validate.mockReturnValue({ error: null });
      loginService.mockResolvedValue(['mockToken', null]);
      
      await login(req, res);
      
      expect(res.cookie).toHaveBeenCalledWith('jwt', 'mockToken', expect.any(Object));
      expect(handleSuccess).toHaveBeenCalledWith(res, 200, 'Inicio de sesión exitoso', { token: 'mockToken' });
    });

    it('debe manejar error de servidor', async () => {
      authValidation.validate.mockImplementation(() => { throw new Error('Crash'); });
      
      await login(req, res);
      
      expect(handleErrorServer).toHaveBeenCalledWith(res, 500, 'Crash');
    });
  });

  describe('register', () => {
    it('debe devolver error de validacion', async () => {
      registerValidation.validate.mockReturnValue({ error: { message: 'Bad params' } });
      
      await register(req, res);
      
      expect(handleErrorClient).toHaveBeenCalledWith(res, 400, 'Error de validación', 'Bad params');
    });

    it('debe devolver error de servicio', async () => {
      registerValidation.validate.mockReturnValue({ error: null });
      registerService.mockResolvedValue([null, 'Duplicated']);
      
      await register(req, res);
      
      expect(handleErrorClient).toHaveBeenCalledWith(res, 400, 'Error registrando al usuario', 'Duplicated');
    });

    it('debe registrar exitosamente', async () => {
      registerValidation.validate.mockReturnValue({ error: null });
      registerService.mockResolvedValue([{ id: 1 }, null]);
      
      await register(req, res);
      
      expect(handleSuccess).toHaveBeenCalledWith(res, 201, 'Usuario registrado con éxito', { id: 1 });
    });

    it('debe manejar error de servidor', async () => {
      registerValidation.validate.mockImplementation(() => { throw new Error('Crash'); });
      
      await register(req, res);
      
      expect(handleErrorServer).toHaveBeenCalledWith(res, 500, 'Crash');
    });
  });

  describe('logout', () => {
    it('debe limpiar cookie y retornar exito', async () => {
      await logout(req, res);
      expect(res.clearCookie).toHaveBeenCalledWith('jwt', { httpOnly: true });
      expect(handleSuccess).toHaveBeenCalledWith(res, 200, 'Sesión cerrada exitosamente');
    });

    it('debe manejar error de servidor', async () => {
      res.clearCookie.mockImplementation(() => { throw new Error('Crash Cookie'); });
      await logout(req, res);
      expect(handleErrorServer).toHaveBeenCalledWith(res, 500, 'Crash Cookie');
    });
  });
});
