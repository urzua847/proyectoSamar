import { jest } from '@jest/globals';
import { mockAppDataSource, mockQueryRunner } from './setup/typeorm.mock.js';

jest.unstable_mockModule('../config/configDb.js', () => ({
  AppDataSource: mockAppDataSource,
}));

jest.unstable_mockModule('../services/audit.service.js', () => ({
  logCreate: jest.fn(),
  logUpdate: jest.fn(),
  logSoftDelete: jest.fn(),
}));

jest.unstable_mockModule('../entity/pedido.entity.js', () => ({ default: class Pedido {} }));
jest.unstable_mockModule('../entity/detallePedido.entity.js', () => ({ default: class DetallePedido {} }));
jest.unstable_mockModule('../entity/productoTerminado.entity.js', () => ({ default: class ProductoTerminado {} }));

const { createPedidoService } = await import('../services/pedido.service.js');

describe('Pedido Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createPedidoService', () => {
    it('debe rechazar si la lista de items esta vacia', async () => {
      const data = { cliente: 'Samar', numero_guia: '123', items: [] };
      const [result, error] = await createPedidoService(data);
      expect(result).toBeNull();
      expect(error).toBe("La lista de productos está vacía.");
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('debe rechazar si la guia ya existe', async () => {
      mockQueryRunner.manager.findOne.mockResolvedValueOnce({ id: 1, numero_guia: '123' });
      const data = { cliente: 'Samar', numero_guia: '123', items: [{ productoId: 1, cantidad_bultos: 1 }] };
      const [result, error] = await createPedidoService(data);
      expect(result).toBeNull();
      expect(error).toContain('El N° de Guía "123" ya existe en el sistema.');
    });

    it('debe rechazar si no hay stock suficiente en modo multi-box', async () => {
      mockQueryRunner.manager.findOne.mockResolvedValueOnce(null); // Guia no existe
      
      // Encontramos el stockItem
      mockQueryRunner.manager.findOne.mockResolvedValueOnce({
        id: 1,
        estado: 'En Stock',
        peso_neto_kg: 20,
        calibre: 'S',
        ubicacion: { tipo: 'contenedor' }
      });

      // Solicitamos 2 bultos, pero pasamos solo 1 ID
      const data = { 
        cliente: 'Samar', 
        numero_guia: '123', 
        items: [{ productoIds: [1], cantidad_bultos: 2 }] 
      };

      const [result, error] = await createPedidoService(data);
      expect(result).toBeNull();
      expect(error).toContain("Stock insuficiente");
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('debe crear el pedido exitosamente si el contenedor tiene stock', async () => {
      mockQueryRunner.manager.findOne.mockResolvedValueOnce(null); // Guia no existe
      
      mockQueryRunner.manager.findOne.mockResolvedValueOnce({
        id: 1,
        estado: 'En Stock',
        peso_neto_kg: 20,
        calibre: 'S',
        ubicacion: { tipo: 'contenedor' }
      });

      const data = { 
        cliente: 'Samar', 
        numero_guia: '123', 
        items: [{ productoIds: [1], cantidad_bultos: 1 }] 
      };

      const mockPedido = { id: 10, numero_guia: '123' };
      mockQueryRunner.manager.create.mockReturnValueOnce(mockPedido); // Crea cabecera
      mockQueryRunner.manager.create.mockReturnValueOnce({ id: 100 }); // Crea detalle
      mockQueryRunner.manager.find.mockResolvedValueOnce([]); // Detalles completos para la auditoría

      const [result, error] = await createPedidoService(data);
      
      expect(error).toBeNull(); // as returns are mostly error throws or valid returns in this new logic
      expect(result).toEqual(mockPedido);
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.manager.save).toHaveBeenCalledTimes(3); // Cabecera, Update StockItem, Nuevo Detalle
    });
    it('debe despachar correctamente en modo legacy/granel', async () => {
      mockQueryRunner.manager.findOne.mockResolvedValueOnce(null); // Guia no existe
      
      mockQueryRunner.manager.findOne.mockResolvedValueOnce({
        id: 99,
        estado: 'En Stock',
        peso_neto_kg: 50, // 50kg disp
        calibre: '10 kg', // format detect -> 10
        ubicacion: { tipo: 'contenedor' }
      });

      const data = { 
        cliente: 'Samar Legacy', 
        numero_guia: '999', 
        items: [{ productoId: 99, cantidad_bultos: 2 }] // 2 * 10kg = 20kg
      };

      const mockPedido = { id: 11, numero_guia: '999' };
      mockQueryRunner.manager.create.mockReturnValueOnce(mockPedido);
      mockQueryRunner.manager.create.mockReturnValueOnce({ id: 101 }); // Crea detalle
      mockQueryRunner.manager.find.mockResolvedValueOnce([]); // Detalles completos

      const [result, error] = await createPedidoService(data);
      
      expect(error).toBeNull();
      expect(result).toEqual(mockPedido);
    });

    it('debe agotar stock en modo legacy si consume todo', async () => {
      mockQueryRunner.manager.findOne.mockResolvedValueOnce(null);
      
      const stockItem = {
        id: 99,
        estado: 'En Stock',
        peso_neto_kg: 10,
        calibre: '10 kg',
        ubicacion: { tipo: 'contenedor' }
      };
      mockQueryRunner.manager.findOne.mockResolvedValueOnce(stockItem);

      const data = { 
        cliente: 'Samar', 
        numero_guia: '888', 
        items: [{ productoId: 99, cantidad_bultos: 1 }] 
      };

      mockQueryRunner.manager.create.mockReturnValueOnce({ id: 12 });
      mockQueryRunner.manager.create.mockReturnValueOnce({ id: 102 });
      mockQueryRunner.manager.find.mockResolvedValueOnce([]);

      await createPedidoService(data);
      
      // Verification that stockItem is depleted
      expect(stockItem.peso_neto_kg).toBe(0);
      expect(stockItem.estado).toBe("Agotado");
    });
  });

  describe('Other services', () => {
    let mockQueryBuilder;
    let mockRepository;

    beforeEach(async () => {
      mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(10),
        getMany: jest.fn().mockResolvedValue([]),
        getOne: jest.fn().mockResolvedValue({ id: 1 }),
      };
      const setup = await import('./setup/typeorm.mock.js');
      mockRepository = setup.mockRepository;
      
      mockRepository.createQueryBuilder = jest.fn().mockReturnValue(mockQueryBuilder);
    });

    it('debe listar pedidos paginados (getPedidosService) con filtros', async () => {
      const { getPedidosService } = await import('../services/pedido.service.js');
      const filters = { cliente: 'Samar', fecha_desde: '2024-01-01', fecha_hasta: '2024-12-31', numero_guia: '123' };
      const [res, err] = await getPedidosService(filters);
      expect(err).toBeNull(); 
      expect(res.data).toEqual([]);
      expect(res.pagination.totalItems).toBe(10);
      expect(mockQueryBuilder.getMany).toHaveBeenCalled();
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledTimes(4);
    });
    
    it('debe listar pedidos para exportacion', async () => {
      const { getPedidosForExport } = await import('../services/pedido.service.js');
      const [res, err] = await getPedidosForExport();
      expect(err).toBeNull();
      expect(res).toEqual([]);
      expect(mockQueryBuilder.getMany).toHaveBeenCalled();
    });
  });
});
