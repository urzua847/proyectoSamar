import { jest } from '@jest/globals';

jest.unstable_mockModule('../../services/loteRecepcion.service.js', () => ({
  createLoteService: jest.fn(),
  getLotesActivosService: jest.fn(),
  getRecepcionesByEntidadService: jest.fn(),
  getLoteByIdService: jest.fn(),
  updateLoteService: jest.fn(),
  deleteLoteService: jest.fn(),
  restoreLoteService: jest.fn(),
}));

jest.unstable_mockModule('../../validations/loteRecepcion.validation.js', () => ({
  createLoteValidation: { validate: jest.fn() },
  updateLoteValidation: { validate: jest.fn() },
}));

jest.unstable_mockModule('../../handlers/responseHandlers.js', () => ({
  handleErrorClient: jest.fn(),
  handleErrorServer: jest.fn(),
  handleSuccess: jest.fn(),
}));

const {
  createLoteService,
  getLotesActivosService,
  getRecepcionesByEntidadService,
  getLoteByIdService,
  updateLoteService,
  deleteLoteService,
  restoreLoteService,
} = await import('../../services/loteRecepcion.service.js');

const { createLoteValidation, updateLoteValidation } = await import('../../validations/loteRecepcion.validation.js');
const { handleErrorClient, handleErrorServer, handleSuccess } = await import('../../handlers/responseHandlers.js');
const { 
  createLote, getLotesActivos, getRecepciones, getRecepcionesByEntidad, 
  getLote, updateLote, deleteLote, restoreLote 
} = await import('../../controllers/loteRecepcion.controller.js');

describe('Lote Recepcion Controller', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      body: {},
      params: {},
      query: {},
      user: { email: 'admin@samar.cl', rol: 'administrador' }
    };
    res = {
      setHeader: jest.fn(),
    };
  });

  describe('createLote', () => {
    it('debe devolver error de validacion', async () => {
      createLoteValidation.validate.mockReturnValue({ error: { message: 'Invalid data' } });
      await createLote(req, res);
      expect(handleErrorClient).toHaveBeenCalledWith(res, 400, 'Error de validación', 'Invalid data');
    });

    it('debe devolver error de servicio', async () => {
      createLoteValidation.validate.mockReturnValue({ error: null });
      createLoteService.mockResolvedValue([null, 'Duplicate']);
      await createLote(req, res);
      expect(handleErrorClient).toHaveBeenCalledWith(res, 400, 'Error al crear el lote', 'Duplicate');
    });

    it('debe crear exitosamente', async () => {
      createLoteValidation.validate.mockReturnValue({ error: null });
      createLoteService.mockResolvedValue([{ id: 1 }, null]);
      await createLote(req, res);
      expect(handleSuccess).toHaveBeenCalledWith(res, 201, 'Lote de recepción creado exitosamente', { id: 1 });
    });

    it('debe manejar errores del servidor', async () => {
      createLoteValidation.validate.mockImplementation(() => { throw new Error('Crash'); });
      await createLote(req, res);
      expect(handleErrorServer).toHaveBeenCalledWith(res, 500, 'Crash');
    });
  });

  describe('getLotesActivos & getRecepciones', () => {
    it('debe obtener lotes activos exitosamente', async () => {
      req.query = { page: 1, limit: 10 };
      getLotesActivosService.mockResolvedValue([[{ id: 1 }], null]);
      await getLotesActivos(req, res);
      expect(handleSuccess).toHaveBeenCalledWith(res, 200, 'Lotes activos encontrados', [{ id: 1 }]);
    });

    it('debe obtener recepciones exitosamente', async () => {
      getLotesActivosService.mockResolvedValue([[{ id: 2 }], null]);
      await getRecepciones(req, res);
      expect(handleSuccess).toHaveBeenCalledWith(res, 200, 'Listado de recepción obtenido', [{ id: 2 }]);
    });

    it('debe devolver error de servicio (getLotesActivos)', async () => {
      getLotesActivosService.mockResolvedValue([null, 'Error DB']);
      await getLotesActivos(req, res);
      expect(handleErrorClient).toHaveBeenCalledWith(res, 404, 'Error DB');
    });

    it('debe devolver error del servidor (getLotesActivos)', async () => {
      getLotesActivosService.mockRejectedValue(new Error('Crash'));
      await getLotesActivos(req, res);
      expect(handleErrorServer).toHaveBeenCalledWith(res, 500, 'Crash');
    });
  });

  describe('getRecepcionesByEntidad', () => {
    it('debe obtener recepciones por entidad', async () => {
      req.params = { entidadId: 1 };
      getRecepcionesByEntidadService.mockResolvedValue([[{ id: 1 }], null]);
      await getRecepcionesByEntidad(req, res);
      expect(handleSuccess).toHaveBeenCalledWith(res, 200, 'Historial de entregas obtenido', [{ id: 1 }]);
    });

    it('debe manejar error de servicio', async () => {
      getRecepcionesByEntidadService.mockResolvedValue([null, 'Not found']);
      await getRecepcionesByEntidad(req, res);
      expect(handleErrorClient).toHaveBeenCalledWith(res, 404, 'Not found');
    });
  });

  describe('getLote', () => {
    it('debe obtener lote por id', async () => {
      req.params = { id: 1 };
      getLoteByIdService.mockResolvedValue([{ id: 1 }, null]);
      await getLote(req, res);
      expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-store');
      expect(handleSuccess).toHaveBeenCalledWith(res, 200, 'Lote encontrado', { id: 1 });
    });

    it('debe manejar error de servicio', async () => {
      getLoteByIdService.mockResolvedValue([null, 'Not found']);
      await getLote(req, res);
      expect(handleErrorClient).toHaveBeenCalledWith(res, 404, 'Not found');
    });
  });

  describe('updateLote', () => {
    it('debe devolver error de validacion', async () => {
      updateLoteValidation.validate.mockReturnValue({ error: { message: 'Invalid data' } });
      await updateLote(req, res);
      expect(handleErrorClient).toHaveBeenCalledWith(res, 400, 'Invalid data');
    });

    it('debe actualizar exitosamente', async () => {
      updateLoteValidation.validate.mockReturnValue({ error: null });
      updateLoteService.mockResolvedValue([{ id: 1 }, null]);
      await updateLote(req, res);
      expect(handleSuccess).toHaveBeenCalledWith(res, 200, 'Lote actualizado correctamente', { id: 1 });
    });
  });

  describe('deleteLote', () => {
    it('debe eliminar exitosamente', async () => {
      deleteLoteService.mockResolvedValue([true, null]);
      await deleteLote(req, res);
      expect(handleSuccess).toHaveBeenCalledWith(res, 200, 'Lote eliminado correctamente (soft delete)', true);
    });
  });

  describe('restoreLote', () => {
    it('debe restaurar exitosamente', async () => {
      restoreLoteService.mockResolvedValue([{ id: 1 }, null]);
      await restoreLote(req, res);
      expect(handleSuccess).toHaveBeenCalledWith(res, 200, 'Lote restaurado exitosamente', { id: 1 });
    });
  });
});
