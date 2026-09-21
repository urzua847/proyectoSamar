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
    mockQueryRunner.manager.findOne = jest.fn();
    mockQueryRunner.query = jest.fn();
    mockQueryRunner.manager.create = jest.fn();
    mockQueryRunner.manager.save = jest.fn();
    mockQueryRunner.manager.find = jest.fn();
    mockQueryRunner.manager.remove = jest.fn();
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

      mockQueryRunner.query = jest.fn().mockResolvedValue([{ id: 1, peso_neto_kg: 20 }]);

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

      mockQueryRunner.query = jest.fn().mockResolvedValue([{ id: 1, peso_neto_kg: 20 }]);

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

      mockQueryRunner.query = jest.fn().mockResolvedValue([{ id: 99, peso_neto_kg: 50 }]);

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

      mockQueryRunner.query = jest.fn().mockResolvedValue([{ id: 99, peso_neto_kg: 10 }]);

      mockQueryRunner.manager.create.mockReturnValueOnce({ id: 12 });
      mockQueryRunner.manager.create.mockReturnValueOnce({ id: 102 });
      mockQueryRunner.manager.find.mockResolvedValueOnce([]);

      await createPedidoService(data);
      
      // Verification that stockItem is depleted
      expect(stockItem.peso_neto_kg).toBe(0);
      expect(stockItem.estado).toBe("Agotado");
    });

    it('debe crear un pedido en modo planificacion/requerimiento', async () => {
      mockQueryRunner.manager.findOne
        .mockResolvedValueOnce(null) // Validar guía no existe
        .mockResolvedValueOnce({ id: 5, nombre: 'Test' }); // Encontrar DefinicionProducto

      const data = {
        cliente: 'Samar',
        numero_guia: 'PLAN-123',
        items: [{ definicionProductoId: 5, cantidad_bultos: 3, peso_caja: 10, tipo_formato: '10 kg' }]
      };
      const mockPedido = { id: 20, numero_guia: 'PLAN-123' };
      mockQueryRunner.manager.create.mockReturnValueOnce(mockPedido); // Pedido
      mockQueryRunner.manager.create.mockReturnValueOnce({ id: 201 }); // Detalle
      mockQueryRunner.manager.find.mockResolvedValueOnce([]); // find Detalles for Audit log
      
      const [result, error] = await createPedidoService(data);
      expect(error).toBeNull();
      expect(result).toEqual(mockPedido);
    });

    it('debe retornar error si falla el bloqueo de stock en modo legacy', async () => {
      mockQueryRunner.manager.findOne = jest.fn();
      mockQueryRunner.query = jest.fn().mockResolvedValue([]); // Vacio = no encontrado
      
      const data = {
        cliente: 'Samar', items: [{ productoId: 99, cantidad_bultos: 1 }]
      };
      const [result, error] = await createPedidoService(data);
      expect(result).toBeNull();
      expect(error).toContain("Producto ID 99 no encontrado");
    });

    it('debe retornar error si legacy item no esta en contenedor', async () => {
      mockQueryRunner.manager.findOne = jest.fn()
        .mockResolvedValueOnce({
          id: 99, estado: 'En Stock', peso_neto_kg: 50, ubicacion: { tipo: 'camara' }
        });
      mockQueryRunner.query = jest.fn().mockResolvedValue([{ id: 99, peso_neto_kg: 50 }]);
      
      const data = {
        cliente: 'Samar', items: [{ productoId: 99, cantidad_bultos: 1 }]
      };
      const [result, error] = await createPedidoService(data);
      expect(result).toBeNull();
      expect(error).toContain("solo se puede despachar desde un Contenedor");
    });

    it('debe retornar error si no se envia ningun id valido', async () => {
      mockQueryRunner.manager.findOne.mockResolvedValueOnce(null);
      const data = {
        cliente: 'Samar', items: [{ cantidad_bultos: 1 }] // Faltan IDs
      };
      const [result, error] = await createPedidoService(data);
      expect(result).toBeNull();
      expect(error).toContain("sin ID de producto");
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
      const [res, err] = await getPedidosForExport({ cliente: 'Samar', fecha_desde: '2024-01-01', fecha_hasta: '2024-12-31', numero_guia: '123' });
      expect(err).toBeNull();
      expect(res).toEqual([]);
      expect(mockQueryBuilder.getMany).toHaveBeenCalled();
    });

    it('debe capturar error en getPedidosService', async () => {
      const { getPedidosService } = await import('../services/pedido.service.js');
      mockQueryBuilder.getMany.mockRejectedValue(new Error("DB Error"));
      const [res, err] = await getPedidosService();
      expect(res).toBeNull();
      expect(err).toBe("DB Error");
    });

    it('debe capturar error en getPedidosForExport', async () => {
      const { getPedidosForExport } = await import('../services/pedido.service.js');
      mockQueryBuilder.getMany.mockRejectedValue(new Error("DB Error"));
      const [res, err] = await getPedidosForExport();
      expect(res).toBeNull();
      expect(err).toBe("DB Error");
    });
  });

  describe('deletePedidoService', () => {
    let deletePedidoService;
    beforeEach(async () => {
      const service = await import('../services/pedido.service.js');
      deletePedidoService = service.deletePedidoService;
    });

    it('debe retornar error si el pedido no existe', async () => {
      mockQueryRunner.manager.findOne.mockResolvedValue(null);
      const [res, err] = await deletePedidoService(999);
      expect(res).toBeNull();
      expect(err).toBe("Pedido no encontrado.");
    });

    it('debe eliminar pedido y restaurar stock', async () => {
      const mockPedido = {
        id: 1,
        detalles: [
          { id: 10, producto: { id: 100 } },
          { id: 11, producto: null } // Detalle modo planificacion
        ]
      };
      mockQueryRunner.manager.findOne = jest.fn()
        .mockResolvedValueOnce(mockPedido) // Pedido
        .mockResolvedValueOnce({ id: 100, estado: 'Vendido' }); // Producto a restaurar

      const [res, err] = await deletePedidoService(1);
      expect(err).toBeNull();
      expect(res).toBe(true);
      expect(mockQueryRunner.manager.save).toHaveBeenCalled();
      expect(mockQueryRunner.manager.remove).toHaveBeenCalledTimes(2);
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
    });

    it('debe capturar error de base de datos', async () => {
      mockQueryRunner.manager.findOne.mockRejectedValue(new Error("DB Error Delete"));
      const [res, err] = await deletePedidoService(1);
      expect(res).toBeNull();
      expect(err).toBe("DB Error Delete");
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });
  });

  describe('completarDespachoPedidoService', () => {
    let completarDespachoPedidoService;
    beforeEach(async () => {
      const service = await import('../services/pedido.service.js');
      completarDespachoPedidoService = service.completarDespachoPedidoService;
    });

    it('debe retornar error si pedido no existe', async () => {
      mockQueryRunner.manager.findOne.mockResolvedValueOnce(null);
      const [res, err] = await completarDespachoPedidoService(1, [], { rol: 'operador' }, false);
      expect(res).toBeNull();
      expect(err).toBe("Pedido no encontrado");
    });

    it('debe retornar error si caja no existe', async () => {
      mockQueryRunner.manager.findOne
        .mockResolvedValueOnce({ id: 1, detalles: [] }) // Pedido
        .mockResolvedValueOnce(null); // Caja
      const [res, err] = await completarDespachoPedidoService(1, [10], { rol: 'operador' }, false);
      expect(res).toBeNull();
      expect(err).toContain("Caja ID 10 no encontrada");
    });

    it('debe retornar error si caja ya esta despachada', async () => {
      mockQueryRunner.manager.findOne
        .mockResolvedValueOnce({ id: 1, detalles: [] }) // Pedido
        .mockResolvedValueOnce({ id: 10, estado: "Despachado" }); // Caja
      const [res, err] = await completarDespachoPedidoService(1, [10], { rol: 'operador' }, false);
      expect(res).toBeNull();
      expect(err).toContain("ya se encuentra despachada");
    });

    it('debe retornar error si caja no corresponde al pedido', async () => {
      mockQueryRunner.manager.findOne
        .mockResolvedValueOnce({ id: 1, detalles: [{ definicion_producto: { id: 99 } }] }) // Pedido
        .mockResolvedValueOnce({ id: 10, definicion: { id: 88, nombre: 'Test' } }); // Caja
      const [res, err] = await completarDespachoPedidoService(1, [10], { rol: 'operador' }, false);
      expect(res).toBeNull();
      expect(err).toContain("no corresponde a ninguno de los productos solicitados");
    });

    it('debe despachar cajas correctamente', async () => {
      const mockReq = { definicion_producto: { id: 99 }, kilos_totales: 0, cajas_asignadas: 0 };
      mockQueryRunner.manager.findOne
        .mockResolvedValueOnce({ id: 1, detalles: [mockReq] }) // Pedido
        .mockResolvedValueOnce({ id: 10, definicion: { id: 99 }, peso_neto_kg: 10 }); // Caja
      
      const [res, err] = await completarDespachoPedidoService(1, [10], { rol: 'operador' }, false);
      expect(err).toBeNull();
      expect(res.id).toBe(1);
      expect(mockQueryRunner.manager.save).toHaveBeenCalled();
    });

    it('debe cerrar pedido si esta completo', async () => {
      const mockReq = { definicion_producto: { id: 99 }, cantidad_bultos: 1, cajas_asignadas: 1 };
      const mockPedido = { id: 1, detalles: [mockReq], estado: 'Pendiente' };
      mockQueryRunner.manager.findOne.mockResolvedValueOnce(mockPedido);
      mockQueryRunner.manager.find.mockResolvedValueOnce([{ definicion: { id: 99 }, peso_neto_kg: 10 }]); // cajas asignadas reales
      
      const [res, err] = await completarDespachoPedidoService(1, [], { rol: 'operador' }, true);
      expect(err).toBeNull();
      expect(res.estado).toBe('Despachado');
    });

    it('debe retornar error si se intenta forzar cierre incompleto sin admin', async () => {
      const mockReq = { definicion_producto: { id: 99 }, cantidad_bultos: 2, cajas_asignadas: 1 };
      mockQueryRunner.manager.findOne.mockResolvedValueOnce({ id: 1, detalles: [mockReq] });
      const [res, err] = await completarDespachoPedidoService(1, [], { rol: 'operador' }, true);
      expect(res).toBeNull();
      expect(err).toContain("El pedido no está completo");
    });
  });

  describe('liberarCajaDePedidoService', () => {
    let liberarCajaDePedidoService;
    beforeEach(async () => {
      const service = await import('../services/pedido.service.js');
      liberarCajaDePedidoService = service.liberarCajaDePedidoService;
    });

    it('debe retornar error si pedido no existe', async () => {
      mockQueryRunner.manager.findOne.mockResolvedValueOnce(null);
      const [res, err] = await liberarCajaDePedidoService(1, 10, { id: 1 });
      expect(res).toBeNull();
      expect(err).toBe("Pedido no encontrado");
    });

    it('debe retornar error si pedido no esta pendiente', async () => {
      mockQueryRunner.manager.findOne.mockResolvedValueOnce({ id: 1, estado: 'Despachado' });
      const [res, err] = await liberarCajaDePedidoService(1, 10, { id: 1 });
      expect(res).toBeNull();
      expect(err).toContain("Solo se pueden liberar cajas de pedidos en estado Pendiente");
    });

    it('debe retornar error si caja no existe', async () => {
      mockQueryRunner.manager.findOne
        .mockResolvedValueOnce({ id: 1, estado: 'Pendiente', detalles: [] })
        .mockResolvedValueOnce(null);
      const [res, err] = await liberarCajaDePedidoService(1, 10, { id: 1 });
      expect(res).toBeNull();
      expect(err).toBe("Caja no encontrada.");
    });

    it('debe retornar error si caja no pertenece al pedido', async () => {
      mockQueryRunner.manager.findOne
        .mockResolvedValueOnce({ id: 1, estado: 'Pendiente', detalles: [] })
        .mockResolvedValueOnce({ id: 10, pedido: { id: 2 } });
      const [res, err] = await liberarCajaDePedidoService(1, 10, { id: 1 });
      expect(res).toBeNull();
      expect(err).toContain("no está asignada a este pedido");
    });

    it('debe liberar caja y actualizar requerimiento y enviar a transito', async () => {
      const mockReq = { definicion_producto: { id: 99 }, kilos_totales: 20, cajas_asignadas: 2 };
      mockQueryRunner.manager.findOne
        .mockResolvedValueOnce({ id: 1, estado: 'Pendiente', detalles: [mockReq] }) // Pedido
        .mockResolvedValueOnce({ id: 10, pedido: { id: 1 }, definicion: { id: 99 }, peso_neto_kg: 10 }) // Caja
        .mockResolvedValueOnce({ id: 3, tipo: 'transito' }); // Ubicacion transito

      const [res, err] = await liberarCajaDePedidoService(1, 10, { id: 1 });
      expect(err).toBeNull();
      expect(res).toBe(true);
      expect(mockReq.kilos_totales).toBe(10);
      expect(mockReq.cajas_asignadas).toBe(1);
    });
  });
});
