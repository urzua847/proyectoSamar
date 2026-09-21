import { jest } from '@jest/globals';
import { mockAppDataSource, mockQueryRunner, mockRepository } from './setup/typeorm.mock.js';

jest.unstable_mockModule('../config/configDb.js', () => ({
  AppDataSource: mockAppDataSource,
}));

jest.unstable_mockModule('../services/audit.service.js', () => ({
  logCreate: jest.fn(),
}));

jest.unstable_mockModule('../entity/productoTerminado.entity.js', () => ({ default: class ProductoTerminado {} }));
jest.unstable_mockModule('../entity/ubicacion.entity.js', () => ({ default: class Ubicacion {} }));

const { trasladoStockService } = await import('../services/traslado.service.js');

describe('Traslado Service', () => {
  let queryBuilderMock;

  beforeEach(() => {
    jest.clearAllMocks();

    queryBuilderMock = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      setLock: jest.fn().mockReturnThis(),
      getMany: jest.fn()
    };

    mockQueryRunner.manager.getRepository = jest.fn().mockReturnValue({
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilderMock)
    });
    mockQueryRunner.query = jest.fn().mockResolvedValue([]);
  });

  describe('trasladoStockService', () => {
    it('debe rechazar si la ubicacion destino no existe o no es contenedor', async () => {
      mockRepository.findOne.mockResolvedValueOnce(null);

      const payload = {
        destinoId: 99,
        items: [{ definicionProductoId: 1, cantidad: 10 }],
        peso_caja: 10
      };

      const [result, error] = await trasladoStockService(payload);
      expect(result).toBeNull();
      expect(error).toContain("Ubicación de destino inválida.");
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('debe rechazar si no hay suficiente stock en las camaras', async () => {
      mockRepository.findOne.mockResolvedValueOnce({ id: 1, tipo: 'contenedor' }); // Destino valido

      // Simular que en Camara solo hay 5kg
      queryBuilderMock.getMany.mockResolvedValue([
        { id: 100, peso_neto_kg: 5 }
      ]);

      const payload = {
        destinoId: 1,
        items: [{ definicionProductoId: 1, cantidad: 10 }], // Se piden 10kg
        peso_caja: 10
      };

      const [result, error] = await trasladoStockService(payload);
      expect(result).toBeNull();
      expect(error).toContain("Stock insuficiente");
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('debe procesar exitosamente el traslado si hay stock', async () => {
      mockRepository.findOne.mockResolvedValueOnce({ id: 1, tipo: 'contenedor' });
      
      const mockStockItem = { id: 100, peso_neto_kg: 20 };
      queryBuilderMock.getMany.mockResolvedValue([ mockStockItem ]);

      // Pedimos mover 10kg
      const payload = {
        destinoId: 1,
        items: [{ definicionProductoId: 1, cantidad: 10 }],
        peso_caja: 10
      };

      mockQueryRunner.query = jest.fn().mockResolvedValue([{ id: 100, peso_neto_kg: 20 }]);

      mockQueryRunner.manager.create.mockReturnValue({ id: 200, peso_neto_kg: 10 }); // Remanente
      mockQueryRunner.manager.save.mockResolvedValue({});

      const [result, error] = await trasladoStockService(payload);

      expect(error).toBeNull();
      expect(result).toBeDefined();
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockStockItem.peso_neto_kg).toBe(10); // Resta 10 de los 20 originales
    });
  });

  describe('trasladoPorScanService', () => {
    let trasladoPorScanService;

    beforeAll(async () => {
      const module = await import('../services/traslado.service.js');
      trasladoPorScanService = module.trasladoPorScanService;
    });

    it('debe requerir boxId y destinoId', async () => {
      const [res, err] = await trasladoPorScanService(null, 2);
      expect(err).toContain("Se requiere el ID de la caja y el ID del destino.");
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('debe rechazar si destino no es contenedor o no existe', async () => {
      mockRepository.findOne.mockResolvedValueOnce(null);
      const [res, err] = await trasladoPorScanService(1, 99);
      expect(err).toContain("Ubicación de destino inválida o no es un contenedor.");
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('debe rechazar si la caja escaneada no existe', async () => {
      mockRepository.findOne.mockResolvedValueOnce({ id: 2, tipo: 'contenedor' }); // destino ok
      mockQueryRunner.query.mockResolvedValueOnce([]); // caja no existe

      const [res, err] = await trasladoPorScanService(1, 2);
      expect(err).toContain("La caja escaneada no existe o fue eliminada.");
    });

    it('debe rechazar si la caja no esta En Stock', async () => {
      mockRepository.findOne.mockResolvedValueOnce({ id: 2, tipo: 'contenedor' });
      mockQueryRunner.query.mockResolvedValueOnce([{ id: 1, estado: 'DESPACHADO' }]);

      const [res, err] = await trasladoPorScanService(1, 2);
      expect(err).toContain("La caja no está en Stock (Estado actual: DESPACHADO).");
    });

    it('debe rechazar si la ubicacion origen es desconocida', async () => {
      mockRepository.findOne.mockResolvedValueOnce({ id: 2, tipo: 'contenedor' });
      mockQueryRunner.query.mockResolvedValueOnce([{ id: 1, estado: 'En Stock', ubicacionId: 3 }]);
      mockQueryRunner.manager.findOne = jest.fn().mockResolvedValueOnce(null); // Origen no existe

      const [res, err] = await trasladoPorScanService(1, 2);
      expect(err).toContain("La ubicación de origen de esta caja es desconocida.");
    });

    it('debe rechazar si la caja ya esta en el destino', async () => {
      mockRepository.findOne.mockResolvedValueOnce({ id: 2, tipo: 'contenedor' });
      mockQueryRunner.query.mockResolvedValueOnce([{ id: 1, estado: 'En Stock', ubicacionId: 2 }]);
      mockQueryRunner.manager.findOne = jest.fn().mockResolvedValueOnce({ id: 2, nombre: 'Contenedor 2' });

      const [res, err] = await trasladoPorScanService(1, 2);
      expect(err).toContain("La caja ya se encuentra en el destino seleccionado (Contenedor 2).");
    });

    it('debe trasladar exitosamente y actualizar la base de datos', async () => {
      mockRepository.findOne.mockResolvedValueOnce({ id: 2, tipo: 'contenedor', nombre: 'Contenedor 2' });
      mockQueryRunner.query.mockResolvedValueOnce([{ id: 1, estado: 'En Stock', ubicacionId: 3, peso_neto_kg: 15 }]);
      mockQueryRunner.manager.findOne = jest.fn().mockResolvedValueOnce({ id: 3, nombre: 'Camara 3' });
      mockQueryRunner.manager.update = jest.fn().mockResolvedValueOnce({ affected: 1 });

      const [res, err] = await trasladoPorScanService(1, 2, { email: 'admin' });
      
      expect(err).toBeNull();
      expect(res).toBe(true);
      expect(mockQueryRunner.manager.update).toHaveBeenCalledWith("ProductoTerminado", { id: 1 }, { ubicacion: expect.any(Object) });
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
    });
  });
});
