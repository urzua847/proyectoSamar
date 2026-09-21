import { jest } from '@jest/globals';

jest.unstable_mockModule('../../services/produccion.service.js', () => ({
  createProduccionYieldService: jest.fn(),
  getProduccionesByLoteService: jest.fn(),
  getProduccionByLoteService: jest.fn(),
  updateProduccionYieldService: jest.fn()
}));

jest.unstable_mockModule('../../validations/produccion.validation.js', () => ({
  createProduccionYieldValidation: { validate: jest.fn() },
  updateProduccionYieldValidation: { validate: jest.fn() }
}));

jest.unstable_mockModule('../../handlers/responseHandlers.js', () => ({
  handleErrorClient: jest.fn(),
  handleErrorServer: jest.fn(),
  handleSuccess: jest.fn(),
}));

const {
  createProduccionYieldService,
  getProduccionesByLoteService,
  getProduccionByLoteService,
  updateProduccionYieldService
} = await import('../../services/produccion.service.js');

const { createProduccionYieldValidation, updateProduccionYieldValidation } = await import('../../validations/produccion.validation.js');
const { handleErrorClient, handleErrorServer, handleSuccess } = await import('../../handlers/responseHandlers.js');
const { createProduccionYield, getProduccionesByLote, getProduccionByLote, updateProduccionYield } = await import('../../controllers/produccion.controller.js');

describe('Produccion Controller', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      body: {},
      params: {},
      user: { email: 'admin@samar.cl', rol: 'administrador' }
    };
    res = {};
  });

  describe('createProduccionYield', () => {
    it('debe devolver error de validacion', async () => {
      createProduccionYieldValidation.validate.mockReturnValue({ error: { message: 'Invalid data' } });
      await createProduccionYield(req, res);
      expect(handleErrorClient).toHaveBeenCalledWith(res, 400, 'Error de validación', 'Invalid data');
    });

    it('debe crear exitosamente', async () => {
      createProduccionYieldValidation.validate.mockReturnValue({ error: null });
      createProduccionYieldService.mockResolvedValue([{ id: 1 }, null]);
      await createProduccionYield(req, res);
      expect(handleSuccess).toHaveBeenCalledWith(res, 201, 'Producción registrada exitosamente', { id: 1 });
    });

    it('debe manejar error de servicio', async () => {
      createProduccionYieldValidation.validate.mockReturnValue({ error: null });
      createProduccionYieldService.mockResolvedValue([null, 'Error de stock']);
      await createProduccionYield(req, res);
      expect(handleErrorClient).toHaveBeenCalledWith(res, 400, 'Error de stock');
    });

    it('debe manejar error de servidor', async () => {
      createProduccionYieldValidation.validate.mockImplementation(() => { throw new Error('Crash'); });
      await createProduccionYield(req, res);
      expect(handleErrorServer).toHaveBeenCalledWith(res, 500, 'Crash');
    });
  });

  describe('getProduccionesByLote', () => {
    it('debe obtener producciones por lote', async () => {
      req.params = { loteId: 1 };
      getProduccionesByLoteService.mockResolvedValue([[{ id: 1 }], null]);
      await getProduccionesByLote(req, res);
      expect(handleSuccess).toHaveBeenCalledWith(res, 200, 'Historial obtenido', [{ id: 1 }]);
    });

    it('debe manejar error de servicio', async () => {
      req.params = { loteId: 1 };
      getProduccionesByLoteService.mockResolvedValue([null, 'Not found']);
      await getProduccionesByLote(req, res);
      expect(handleErrorClient).toHaveBeenCalledWith(res, 400, 'Not found');
    });

    it('debe manejar error de servidor', async () => {
      req.params = { loteId: 1 };
      getProduccionesByLoteService.mockRejectedValue(new Error('Crash'));
      await getProduccionesByLote(req, res);
      expect(handleErrorServer).toHaveBeenCalledWith(res, 500, 'Crash');
    });
  });

  describe('getProduccionByLote', () => {
    it('debe obtener produccion por lote', async () => {
      req.params = { loteId: 1 };
      getProduccionByLoteService.mockResolvedValue([{ id: 1 }, null]);
      await getProduccionByLote(req, res);
      expect(handleSuccess).toHaveBeenCalledWith(res, 200, 'Producción obtenida', { id: 1 });
    });

    it('debe manejar error de servicio', async () => {
      req.params = { loteId: 1 };
      getProduccionByLoteService.mockResolvedValue([null, 'Not found']);
      await getProduccionByLote(req, res);
      expect(handleErrorClient).toHaveBeenCalledWith(res, 400, 'Not found');
    });

    it('debe manejar error de servidor', async () => {
      req.params = { loteId: 1 };
      getProduccionByLoteService.mockRejectedValue(new Error('Crash'));
      await getProduccionByLote(req, res);
      expect(handleErrorServer).toHaveBeenCalledWith(res, 500, 'Crash');
    });
  });

  describe('updateProduccionYield', () => {
    it('debe devolver error de validacion', async () => {
      updateProduccionYieldValidation.validate.mockReturnValue({ error: { message: 'Invalid data' } });
      await updateProduccionYield(req, res);
      expect(handleErrorClient).toHaveBeenCalledWith(res, 400, 'Error de validación', 'Invalid data');
    });

    it('debe actualizar exitosamente', async () => {
      req.params = { loteId: 1 };
      updateProduccionYieldValidation.validate.mockReturnValue({ error: null });
      updateProduccionYieldService.mockResolvedValue([{ id: 1 }, null]);
      await updateProduccionYield(req, res);
      expect(handleSuccess).toHaveBeenCalledWith(res, 200, 'Producción actualizada correctamente', { id: 1 });
    });

    it('debe manejar error de servicio', async () => {
      req.params = { loteId: 1 };
      updateProduccionYieldValidation.validate.mockReturnValue({ error: null });
      updateProduccionYieldService.mockResolvedValue([null, 'No se puede editar']);
      await updateProduccionYield(req, res);
      expect(handleErrorClient).toHaveBeenCalledWith(res, 400, 'No se puede editar');
    });

    it('debe manejar error de servidor', async () => {
      updateProduccionYieldValidation.validate.mockImplementation(() => { throw new Error('Crash'); });
      await updateProduccionYield(req, res);
      expect(handleErrorServer).toHaveBeenCalledWith(res, 500, 'Crash');
    });
  });
});
