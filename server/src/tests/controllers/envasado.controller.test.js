import { jest } from '@jest/globals';

jest.unstable_mockModule('../../services/envasado.service.js', () => ({
  createProduccionService: jest.fn(),
  deleteProduccionService: jest.fn(),
  deleteManyProduccionService: jest.fn(),
  getResumenProduccionByLoteService: jest.fn(),
  getProduccionesService: jest.fn(),
  getStockCamarasService: jest.fn(),
  getStockContenedoresService: jest.fn(),
  getCajaByIdService: jest.fn(),
  getStockTransitoService: jest.fn(),
}));

jest.unstable_mockModule('../../validations/envasado.validation.js', () => ({
  createProduccionValidation: { validate: jest.fn() },
}));

jest.unstable_mockModule('../../handlers/responseHandlers.js', () => ({
  handleErrorClient: jest.fn(),
  handleErrorServer: jest.fn(),
  handleSuccess: jest.fn(),
}));

const {
  createProduccionService,
  deleteProduccionService,
  deleteManyProduccionService,
  getResumenProduccionByLoteService,
  getProduccionesService,
  getStockCamarasService,
  getStockContenedoresService,
  getCajaByIdService,
  getStockTransitoService
} = await import('../../services/envasado.service.js');

const { createProduccionValidation } = await import('../../validations/envasado.validation.js');
const { handleErrorClient, handleErrorServer, handleSuccess } = await import('../../handlers/responseHandlers.js');
const { 
  createProduccion, deleteProduccion, deleteManyProduccion, getResumenProduccionByLote,
  getProducciones, getStockCamaras, getStockContenedores, getCajaById, getStockTransito
} = await import('../../controllers/envasado.controller.js');

describe('Envasado Controller', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      body: {},
      params: {},
      query: {},
      user: { email: 'admin@samar.cl', rol: 'administrador' }
    };
    res = {};
  });

  describe('createProduccion', () => {
    it('debe devolver error de validacion', async () => {
      createProduccionValidation.validate.mockReturnValue({ error: { message: 'Invalid data' } });
      await createProduccion(req, res);
      expect(handleErrorClient).toHaveBeenCalledWith(res, 400, 'Error de validación', 'Invalid data');
    });

    it('debe crear exitosamente', async () => {
      createProduccionValidation.validate.mockReturnValue({ error: null });
      createProduccionService.mockResolvedValue([[{ id: 1 }, { id: 2 }], null]);
      await createProduccion(req, res);
      expect(handleSuccess).toHaveBeenCalledWith(res, 201, 'Producción registrada exitosamente', { cantidad: 2 });
    });

    it('debe manejar error de servicio', async () => {
      createProduccionValidation.validate.mockReturnValue({ error: null });
      createProduccionService.mockResolvedValue([null, 'Error de inventario']);
      await createProduccion(req, res);
      expect(handleErrorClient).toHaveBeenCalledWith(res, 400, 'Error de inventario');
    });

    it('debe manejar error de servidor', async () => {
      createProduccionValidation.validate.mockImplementation(() => { throw new Error('Crash'); });
      await createProduccion(req, res);
      expect(handleErrorServer).toHaveBeenCalledWith(res, 500, 'Crash');
    });
  });

  describe('deleteProduccion', () => {
    it('debe eliminar exitosamente', async () => {
      req.params = { id: 1 };
      deleteProduccionService.mockResolvedValue([true, null]);
      await deleteProduccion(req, res);
      expect(handleSuccess).toHaveBeenCalledWith(res, 200, 'Producto devuelto exitosamente');
    });

    it('debe manejar error de servicio', async () => {
      req.params = { id: 1 };
      deleteProduccionService.mockResolvedValue([null, 'Not found']);
      await deleteProduccion(req, res);
      expect(handleErrorClient).toHaveBeenCalledWith(res, 404, 'Not found');
    });

    it('debe manejar error de servidor', async () => {
      deleteProduccionService.mockRejectedValue(new Error('Crash'));
      await deleteProduccion(req, res);
      expect(handleErrorServer).toHaveBeenCalledWith(res, 500, 'Crash');
    });
  });

  describe('deleteManyProduccion', () => {
    it('debe eliminar exitosamente', async () => {
      req.body = { ids: [1, 2] };
      deleteManyProduccionService.mockResolvedValue([true, null]);
      await deleteManyProduccion(req, res);
      expect(handleSuccess).toHaveBeenCalledWith(res, 200, 'Productos devueltos exitosamente');
    });

    it('debe manejar error de servicio', async () => {
      req.body = { ids: [1, 2] };
      deleteManyProduccionService.mockResolvedValue([null, 'Not found']);
      await deleteManyProduccion(req, res);
      expect(handleErrorClient).toHaveBeenCalledWith(res, 404, 'Not found');
    });

    it('debe manejar error de servidor', async () => {
      deleteManyProduccionService.mockRejectedValue(new Error('Crash'));
      await deleteManyProduccion(req, res);
      expect(handleErrorServer).toHaveBeenCalledWith(res, 500, 'Crash');
    });
  });

  describe('getResumenProduccionByLote', () => {
    it('debe obtener resumen exitosamente', async () => {
      getResumenProduccionByLoteService.mockResolvedValue([{ total: 10 }, null]);
      await getResumenProduccionByLote(req, res);
      expect(handleSuccess).toHaveBeenCalledWith(res, 200, 'Resumen obtenido', { total: 10 });
    });

    it('debe manejar error de servicio', async () => {
      getResumenProduccionByLoteService.mockResolvedValue([null, 'Not found']);
      await getResumenProduccionByLote(req, res);
      expect(handleErrorClient).toHaveBeenCalledWith(res, 404, 'Not found');
    });

    it('debe manejar error de servidor', async () => {
      getResumenProduccionByLoteService.mockRejectedValue(new Error('Crash'));
      await getResumenProduccionByLote(req, res);
      expect(handleErrorServer).toHaveBeenCalledWith(res, 500, 'Crash');
    });
  });

  describe('getProducciones', () => {
    it('debe obtener producciones', async () => {
      req.query = { page: 1, limit: 10 };
      getProduccionesService.mockResolvedValue([[{ id: 1 }], null]);
      await getProducciones(req, res);
      expect(handleSuccess).toHaveBeenCalledWith(res, 200, 'Historial de producción obtenido', [{ id: 1 }]);
    });

    it('debe manejar error de servicio', async () => {
      getProduccionesService.mockResolvedValue([null, 'Error DB']);
      await getProducciones(req, res);
      expect(handleErrorClient).toHaveBeenCalledWith(res, 404, 'Error DB');
    });

    it('debe manejar error de servidor', async () => {
      getProduccionesService.mockRejectedValue(new Error('Crash'));
      await getProducciones(req, res);
      expect(handleErrorServer).toHaveBeenCalledWith(res, 500, 'Crash');
    });
  });

  describe('getStockCamaras', () => {
    it('debe obtener stock de camaras', async () => {
      getStockCamarasService.mockResolvedValue([[{ id: 1 }], null]);
      await getStockCamaras(req, res);
      expect(handleSuccess).toHaveBeenCalledWith(res, 200, 'Stock de cámaras obtenido', [{ id: 1 }]);
    });

    it('debe manejar error de servicio', async () => {
      getStockCamarasService.mockResolvedValue([null, 'Error DB']);
      await getStockCamaras(req, res);
      expect(handleErrorClient).toHaveBeenCalledWith(res, 404, 'Error DB');
    });

    it('debe manejar error de servidor', async () => {
      getStockCamarasService.mockRejectedValue(new Error('Crash'));
      await getStockCamaras(req, res);
      expect(handleErrorServer).toHaveBeenCalledWith(res, 500, 'Crash');
    });
  });

  describe('getStockContenedores', () => {
    it('debe obtener stock de contenedores', async () => {
      getStockContenedoresService.mockResolvedValue([[{ id: 1 }], null]);
      await getStockContenedores(req, res);
      expect(handleSuccess).toHaveBeenCalledWith(res, 200, 'Stock de contenedores obtenido', [{ id: 1 }]);
    });

    it('debe manejar error de servicio', async () => {
      getStockContenedoresService.mockResolvedValue([null, 'Error DB']);
      await getStockContenedores(req, res);
      expect(handleErrorClient).toHaveBeenCalledWith(res, 404, 'Error DB');
    });

    it('debe manejar error de servidor', async () => {
      getStockContenedoresService.mockRejectedValue(new Error('Crash'));
      await getStockContenedores(req, res);
      expect(handleErrorServer).toHaveBeenCalledWith(res, 500, 'Crash');
    });
  });

  describe('getCajaById', () => {
    it('debe obtener caja', async () => {
      req.params = { id: 1 };
      getCajaByIdService.mockResolvedValue([{ id: 1 }, null]);
      await getCajaById(req, res);
      expect(handleSuccess).toHaveBeenCalledWith(res, 200, 'Detalle de caja obtenido', { id: 1 });
    });

    it('debe manejar error de servicio', async () => {
      req.params = { id: 1 };
      getCajaByIdService.mockResolvedValue([null, 'Error DB']);
      await getCajaById(req, res);
      expect(handleErrorClient).toHaveBeenCalledWith(res, 404, 'Error DB');
    });

    it('debe manejar error de servidor', async () => {
      req.params = { id: 1 };
      getCajaByIdService.mockRejectedValue(new Error('Crash'));
      await getCajaById(req, res);
      expect(handleErrorServer).toHaveBeenCalledWith(res, 500, 'Crash');
    });
  });

  describe('getStockTransito', () => {
    it('debe obtener stock en transito', async () => {
      getStockTransitoService.mockResolvedValue([[{ id: 1 }], null]);
      await getStockTransito(req, res);
      expect(handleSuccess).toHaveBeenCalledWith(res, 200, 'Stock en transito obtenido exitosamente', [{ id: 1 }]);
    });

    it('debe manejar error de servicio', async () => {
      getStockTransitoService.mockResolvedValue([null, 'Error DB']);
      await getStockTransito(req, res);
      expect(handleErrorClient).toHaveBeenCalledWith(res, 404, 'Error DB');
    });

    it('debe manejar error de servidor', async () => {
      getStockTransitoService.mockRejectedValue(new Error('Crash'));
      await getStockTransito(req, res);
      expect(handleErrorServer).toHaveBeenCalledWith(res, 500, 'Crash');
    });
  });
});
