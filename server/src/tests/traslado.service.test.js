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
      expect(error).toContain("Ubicación de destino inválida o no es un contenedor.");
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

      mockQueryRunner.manager.create.mockReturnValue({ id: 200, peso_neto_kg: 10 }); // Remanente
      mockQueryRunner.manager.save.mockResolvedValue({});

      const [result, error] = await trasladoStockService(payload);

      expect(error).toBeNull();
      expect(result).toBeDefined();
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockStockItem.peso_neto_kg).toBe(10); // Resta 10 de los 20 originales
    });
  });
});
