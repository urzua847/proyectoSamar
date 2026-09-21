import { jest } from '@jest/globals';

jest.unstable_mockModule('../../services/traslado.service.js', () => ({
  trasladoStockService: jest.fn(),
  trasladoPorScanService: jest.fn(),
}));

jest.unstable_mockModule('../../handlers/responseHandlers.js', () => ({
  handleErrorClient: jest.fn(),
  handleErrorServer: jest.fn(),
  handleSuccess: jest.fn(),
}));

const { trasladoStockService, trasladoPorScanService } = await import('../../services/traslado.service.js');
const { handleErrorClient, handleErrorServer, handleSuccess } = await import('../../handlers/responseHandlers.js');
const { createTraslado, trasladoPorScan } = await import('../../controllers/traslado.controller.js');

describe('Traslado Controller', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      body: {},
      user: { email: 'admin@samar.cl', rol: 'administrador' }
    };
    res = {};
  });

  describe('createTraslado', () => {
    it('debe devolver error de validacion', async () => {
      req.body = {};
      await createTraslado(req, res);
      expect(handleErrorClient).toHaveBeenCalledWith(res, 400, expect.stringContaining('Error de validación'), expect.any(String));
    });

    it('debe crear exitosamente', async () => {
      req.body = {
        destinoId: 1,
        peso_caja: 10,
        items: [{ definicionProductoId: 1, cantidad: 5 }]
      };
      trasladoStockService.mockResolvedValue([[{ id: 1 }], null]);
      await createTraslado(req, res);
      expect(handleSuccess).toHaveBeenCalledWith(res, 200, 'Traslado realizado con éxito', [{ id: 1 }]);
    });

    it('debe manejar error de servicio', async () => {
      req.body = {
        destinoId: 1,
        peso_caja: 10,
        items: [{ definicionProductoId: 1, cantidad: 5 }]
      };
      trasladoStockService.mockResolvedValue([null, 'Error de stock']);
      await createTraslado(req, res);
      expect(handleErrorClient).toHaveBeenCalledWith(res, 400, 'Error de stock');
    });

    it('debe manejar error de servidor', async () => {
      req.body = {
        destinoId: 1,
        peso_caja: 10,
        items: [{ definicionProductoId: 1, cantidad: 5 }]
      };
      trasladoStockService.mockRejectedValue(new Error('Crash'));
      await createTraslado(req, res);
      expect(handleErrorServer).toHaveBeenCalledWith(res, 500, 'Crash');
    });
  });

  describe('trasladoPorScan', () => {
    it('debe devolver error si faltan parametros', async () => {
      req.body = { boxId: 1 };
      await trasladoPorScan(req, res);
      expect(handleErrorClient).toHaveBeenCalledWith(res, 400, 'Error de validación: Se requiere boxId y destinoId');
    });

    it('debe trasladar por scan exitosamente (id numerico)', async () => {
      req.body = { boxId: 123, destinoId: 2 };
      trasladoPorScanService.mockResolvedValue([true, null]);
      await trasladoPorScan(req, res);
      expect(trasladoPorScanService).toHaveBeenCalledWith(123, 2, req.user);
      expect(handleSuccess).toHaveBeenCalledWith(res, 200, 'Caja escaneada y trasladada con éxito', { boxId: 123, destinoId: 2 });
    });

    it('debe trasladar por scan exitosamente (PT string)', async () => {
      req.body = { boxId: 'PT-1234', destinoId: 2 };
      trasladoPorScanService.mockResolvedValue([true, null]);
      await trasladoPorScan(req, res);
      expect(trasladoPorScanService).toHaveBeenCalledWith(1234, 2, req.user);
      expect(handleSuccess).toHaveBeenCalledWith(res, 200, 'Caja escaneada y trasladada con éxito', { boxId: 1234, destinoId: 2 });
    });

    it('debe manejar error de servicio', async () => {
      req.body = { boxId: 123, destinoId: 2 };
      trasladoPorScanService.mockResolvedValue([null, 'No se pudo mover']);
      await trasladoPorScan(req, res);
      expect(handleErrorClient).toHaveBeenCalledWith(res, 400, 'No se pudo mover');
    });

    it('debe manejar error de servidor', async () => {
      req.body = { boxId: 123, destinoId: 2 };
      trasladoPorScanService.mockRejectedValue(new Error('Crash'));
      await trasladoPorScan(req, res);
      expect(handleErrorServer).toHaveBeenCalledWith(res, 500, 'Crash');
    });
  });
});
