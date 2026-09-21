import { jest } from '@jest/globals';

jest.unstable_mockModule('../../services/materiaPrima.service.js', () => ({
  getMateriasPrimasService: jest.fn(),
  createMateriaPrimaService: jest.fn(),
  updateMateriaPrimaService: jest.fn(),
  deleteMateriaPrimaService: jest.fn(),
}));

jest.unstable_mockModule('../../validations/materiaPrima.validation.js', () => ({
  createMateriaPrimaValidation: { validate: jest.fn() },
  updateMateriaPrimaValidation: { validate: jest.fn() },
}));

jest.unstable_mockModule('../../handlers/responseHandlers.js', () => ({
  handleErrorClient: jest.fn(),
  handleErrorServer: jest.fn(),
  handleSuccess: jest.fn(),
}));

const {
  getMateriasPrimasService,
  createMateriaPrimaService,
  updateMateriaPrimaService,
  deleteMateriaPrimaService,
} = await import('../../services/materiaPrima.service.js');

const { createMateriaPrimaValidation, updateMateriaPrimaValidation } = await import('../../validations/materiaPrima.validation.js');
const { handleErrorClient, handleErrorServer, handleSuccess } = await import('../../handlers/responseHandlers.js');
const { getMateriasPrimas, createMateriaPrima, updateMateriaPrima, deleteMateriaPrima } = await import('../../controllers/materiaPrima.controller.js');

describe('Materia Prima Controller', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      body: {},
      params: {},
    };
    res = {};
  });

  describe('getMateriasPrimas', () => {
    it('debe obtener materias primas', async () => {
      getMateriasPrimasService.mockResolvedValue([[{ id: 1 }], null]);
      await getMateriasPrimas(req, res);
      expect(handleSuccess).toHaveBeenCalledWith(res, 200, 'Materias primas encontradas', [{ id: 1 }]);
    });

    it('debe manejar error de servicio', async () => {
      getMateriasPrimasService.mockResolvedValue([null, 'Not found']);
      await getMateriasPrimas(req, res);
      expect(handleErrorClient).toHaveBeenCalledWith(res, 404, 'Not found');
    });

    it('debe manejar error del servidor', async () => {
      getMateriasPrimasService.mockRejectedValue(new Error('Crash'));
      await getMateriasPrimas(req, res);
      expect(handleErrorServer).toHaveBeenCalledWith(res, 500, 'Crash');
    });
  });

  describe('createMateriaPrima', () => {
    it('debe devolver error de validacion', async () => {
      createMateriaPrimaValidation.validate.mockReturnValue({ error: { message: 'Invalid data' } });
      await createMateriaPrima(req, res);
      expect(handleErrorClient).toHaveBeenCalledWith(res, 400, 'Error de validación', 'Invalid data');
    });

    it('debe crear exitosamente con rendimiento_teorico_global vacio', async () => {
      req.body = { rendimiento_teorico_global: '' };
      createMateriaPrimaValidation.validate.mockReturnValue({ error: null });
      createMateriaPrimaService.mockResolvedValue([{ id: 1 }, null]);
      await createMateriaPrima(req, res);
      expect(req.body.rendimiento_teorico_global).toBeNull();
      expect(handleSuccess).toHaveBeenCalledWith(res, 201, 'Materia prima creada exitosamente', { id: 1 });
    });

    it('debe crear exitosamente con rendimiento_teorico_global numerico', async () => {
      req.body = { rendimiento_teorico_global: '45' };
      createMateriaPrimaValidation.validate.mockReturnValue({ error: null });
      createMateriaPrimaService.mockResolvedValue([{ id: 1 }, null]);
      await createMateriaPrima(req, res);
      expect(req.body.rendimiento_teorico_global).toBe(45);
    });

    it('debe devolver error de servicio', async () => {
      req.body = {};
      createMateriaPrimaValidation.validate.mockReturnValue({ error: null });
      createMateriaPrimaService.mockResolvedValue([null, 'Duplicate']);
      await createMateriaPrima(req, res);
      expect(handleErrorClient).toHaveBeenCalledWith(res, 400, 'Error al crear materia prima', 'Duplicate');
    });

    it('debe manejar error de servidor', async () => {
      createMateriaPrimaValidation.validate.mockImplementation(() => { throw new Error('Crash'); });
      await createMateriaPrima(req, res);
      expect(handleErrorServer).toHaveBeenCalledWith(res, 500, 'Crash');
    });
  });

  describe('updateMateriaPrima', () => {
    it('debe devolver error de validacion', async () => {
      updateMateriaPrimaValidation.validate.mockReturnValue({ error: { message: 'Invalid data' } });
      await updateMateriaPrima(req, res);
      expect(handleErrorClient).toHaveBeenCalledWith(res, 400, 'Error de validación', 'Invalid data');
    });

    it('debe actualizar exitosamente', async () => {
      req.params = { id: 1 };
      req.body = { rendimiento_teorico_global: '' };
      updateMateriaPrimaValidation.validate.mockReturnValue({ error: null });
      updateMateriaPrimaService.mockResolvedValue([{ id: 1 }, null]);
      await updateMateriaPrima(req, res);
      expect(req.body.rendimiento_teorico_global).toBeNull();
      expect(handleSuccess).toHaveBeenCalledWith(res, 200, 'Materia prima actualizada', { id: 1 });
    });

    it('debe actualizar exitosamente numerico', async () => {
      req.params = { id: 1 };
      req.body = { rendimiento_teorico_global: '33' };
      updateMateriaPrimaValidation.validate.mockReturnValue({ error: null });
      updateMateriaPrimaService.mockResolvedValue([{ id: 1 }, null]);
      await updateMateriaPrima(req, res);
      expect(req.body.rendimiento_teorico_global).toBe(33);
    });

    it('debe devolver error de servicio', async () => {
      updateMateriaPrimaValidation.validate.mockReturnValue({ error: null });
      updateMateriaPrimaService.mockResolvedValue([null, 'Not found']);
      await updateMateriaPrima(req, res);
      expect(handleErrorClient).toHaveBeenCalledWith(res, 400, 'Error al actualizar materia prima', 'Not found');
    });

    it('debe manejar error de servidor', async () => {
      updateMateriaPrimaValidation.validate.mockImplementation(() => { throw new Error('Crash'); });
      await updateMateriaPrima(req, res);
      expect(handleErrorServer).toHaveBeenCalledWith(res, 500, 'Crash');
    });
  });

  describe('deleteMateriaPrima', () => {
    it('debe eliminar exitosamente', async () => {
      req.params = { id: 1 };
      deleteMateriaPrimaService.mockResolvedValue([true, null]);
      await deleteMateriaPrima(req, res);
      expect(handleSuccess).toHaveBeenCalledWith(res, 200, 'Materia prima eliminada');
    });

    it('debe devolver error de servicio', async () => {
      deleteMateriaPrimaService.mockResolvedValue([null, 'Not found']);
      await deleteMateriaPrima(req, res);
      expect(handleErrorClient).toHaveBeenCalledWith(res, 400, 'Error al eliminar materia prima', 'Not found');
    });

    it('debe manejar error de servidor', async () => {
      deleteMateriaPrimaService.mockRejectedValue(new Error('Crash'));
      await deleteMateriaPrima(req, res);
      expect(handleErrorServer).toHaveBeenCalledWith(res, 500, 'Crash');
    });
  });
});
