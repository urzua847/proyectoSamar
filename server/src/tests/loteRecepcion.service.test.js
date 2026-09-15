import { jest } from '@jest/globals';
import { mockAppDataSource, mockRepository, mockQueryRunner } from './setup/typeorm.mock.js';

// Mocks TypeORM
jest.unstable_mockModule('../config/configDb.js', () => ({
  AppDataSource: mockAppDataSource,
}));

// Mocks de Auditoría
jest.unstable_mockModule('../services/audit.service.js', () => ({
  logCreate: jest.fn(),
  logUpdate: jest.fn(),
  logSoftDelete: jest.fn(),
  createAuditLog: jest.fn()
}));

// Mock Entidades
jest.unstable_mockModule('../entity/loteRecepcion.entity.js', () => ({ default: class LoteRecepcion {} }));
jest.unstable_mockModule('../entity/proveedor.entity.js', () => ({ default: class Proveedor {} }));
jest.unstable_mockModule('../entity/materiaPrima.entity.js', () => ({ default: class MateriaPrima {} }));
jest.unstable_mockModule('../entity/user.entity.js', () => ({ default: class User {} }));
jest.unstable_mockModule('../entity/productoTerminado.entity.js', () => ({ default: class ProductoTerminado {} }));
jest.unstable_mockModule('../entity/produccion.entity.js', () => ({ default: class Produccion {} }));

// Import del servicio
const { 
    createLoteService, 
    updateLoteService, 
    deleteLoteService, 
    getLotesActivosService,
    getRecepcionesByEntidadService,
    getLoteByIdService
} = await import('../services/loteRecepcion.service.js');

describe('Lote Recepcion Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createLoteService', () => {
    it('debe rechazar si proveedor o materia prima no existen', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      const [result, error] = await createLoteService({ proveedorId: 1, materiaPrimaId: 1 }, 'test@test.com');
      expect(result).toBeNull();
      expect(error).toBe("Proveedor no encontrado");
    });

    it('debe crear el lote exitosamente asignando codigo y guardando', async () => {
      mockRepository.findOne
        .mockResolvedValueOnce({ id: 1, nombre: 'Proveedor' }) // proveedor
        .mockResolvedValueOnce({ id: 1, nombre: 'Materia' }) // materiaPrima
        .mockResolvedValueOnce({ id: 1, email: 'op@op.com' }); // operario

      mockRepository.count.mockResolvedValue(5); // Hay 5 lotes este mes
      
      const createdLote = { id: 10, codigo: '1026-06', peso_bruto_kg: 500 };
      mockRepository.create.mockReturnValue(createdLote);
      mockRepository.save.mockResolvedValue(createdLote);

      const [result, error] = await createLoteService({ proveedorId: 1, materiaPrimaId: 1, peso_bruto_kg: 500, numero_bandejas: 10, pesadas: [] }, 'op@op.com');

      expect(error).toBeNull();
      expect(result).toEqual(createdLote);
      expect(mockRepository.save).toHaveBeenCalled();
    });
  });

  describe('updateLoteService', () => {
    it('debe rechazar actualizar lote si no existe', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      const [result, error] = await updateLoteService(999, {}, { id: 1 });
      expect(result).toBeNull();
      expect(error).toContain("Lote no encontrado");
    });

    it('debe rechazar actualizar peso_bruto_kg si el lote ya tiene produccion iniciada', async () => {
      mockRepository.findOne.mockResolvedValue({
        id: 1,
        productosTerminados: [{ id: 5 }] // Tiene producción
      });
      const [result, error] = await updateLoteService(1, { peso_bruto_kg: 1200 }, { id: 1 });
      expect(result).toBeNull();
      expect(error).toContain("No se pueden editar peso/proveedor porque este lote ya tiene producción iniciada");
    });

    it('debe actualizar lote exitosamente', async () => {
      mockRepository.findOne.mockResolvedValue({
        id: 1,
        peso_bruto_kg: 1000,
        estado: 'Abierto'
      });
      
      const payload = {
        proveedorId: 2,
        materiaPrimaId: 3,
        peso_bruto_kg: 1200,
        estado: 'Cerrado',
        en_proceso_produccion: true
      };
      
      mockAppDataSource.getRepository().findOne = jest.fn().mockResolvedValue({ id: 2 });
      mockRepository.save.mockResolvedValue({ id: 1, ...payload });

      const [result, error] = await updateLoteService(1, payload, { email: 'admin' });
      expect(error).toBeNull();
      expect(result.estado).toBe('Cerrado');
    });
  });

  describe('deleteLoteService (Soft Delete)', () => {
    it('debe rechazar si el usuario no es administrador y el lote tiene produccion', async () => {
      mockQueryRunner.manager.findOne.mockResolvedValue({
        id: 1,
        producciones: [{ id: 1 }] // tiene produccion
      });

      const [result, error] = await deleteLoteService(1, 'operario', true);
      expect(result).toBeNull();
      expect(error).toContain("No tienes permisos de Administrador");
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('debe rechazar si no se usa force (confirmacion) cuando tiene produccion', async () => {
      mockQueryRunner.manager.findOne.mockResolvedValue({
        id: 1,
        producciones: [{ id: 1 }] // tiene produccion
      });

      const [result, error] = await deleteLoteService(1, 'administrador', false); // force = false
      expect(result).toBeNull();
      expect(error).toContain("Se requiere confirmación de Administrador");
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });
    
    it('debe rechazar si el lote no existe', async () => {
      mockQueryRunner.manager.findOne.mockResolvedValue(null);
      const [result, error] = await deleteLoteService(99, 'admin', true);
      expect(result).toBeNull();
      expect(error).toContain("Lote no encontrado");
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });
    
    it('debe eliminar correctamente con force si es admin', async () => {
      mockQueryRunner.manager.findOne.mockResolvedValue({
        id: 1,
        producciones: [{ id: 1 }]
      });
      const [result, error] = await deleteLoteService(1, 'administrador', true);
      expect(error).toBeNull();
      expect(result).toBeDefined();
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
    });
  });
  
  describe('getLotesActivosService', () => {
    it('debe retornar lotes paginados', async () => {
      mockRepository.count.mockResolvedValue(10);
      mockRepository.find.mockResolvedValue([{ id: 1 }]);
      
      const [result, error] = await getLotesActivosService({ page: 1, limit: 10 });
      expect(error).toBeNull();
      expect(result.data.length).toBe(1);
      expect(result.pagination.totalItems).toBe(10);
    });
  });

  describe('getRecepcionesByEntidadService', () => {
    it('debe retornar recepciones de un proveedor', async () => {
      mockRepository.find.mockResolvedValue([{ id: 1, proveedor: { id: 2 } }]);
      const [result, error] = await getRecepcionesByEntidadService(2);
      expect(error).toBeNull();
      expect(result.length).toBe(1);
    });
  });

  describe('getLoteByIdService', () => {
    it('debe retornar un lote por su id', async () => {
      mockRepository.findOne.mockResolvedValue({ id: 1 });
      const [result, error] = await getLoteByIdService(1);
      expect(error).toBeNull();
      expect(result.id).toBe(1);
    });
  });

  describe('deleteLoteService (Deep Delete)', () => {
    it('debe rechazar si hay productos vendidos', async () => {
      mockQueryRunner.manager.findOne.mockResolvedValue({
        id: 1,
        producciones: [{ id: 1 }],
        productosTerminados: [{ id: 10, estado: 'Vendido' }]
      });
      const [result, error] = await deleteLoteService(1, 'administrador', true);
      expect(result).toBeNull();
      expect(error).toContain("No se puede eliminar: hay productos que ya fueron VENDIDOS");
    });
    
    it('debe eliminar en cascada correctamente', async () => {
      mockQueryRunner.manager.findOne.mockResolvedValue({
        id: 1,
        producciones: [{ id: 1 }],
        productosTerminados: [{ id: 10, estado: 'En Stock' }]
      });
      const [result, error] = await deleteLoteService(1, 'administrador', true);
      expect(error).toBeNull();
      expect(result).toBeDefined();
      expect(mockQueryRunner.manager.save).toHaveBeenCalled();
    });
  });

  describe('restoreLoteService', () => {
    let queryBuilderMock;
    beforeEach(() => {
        queryBuilderMock = {
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            leftJoinAndSelect: jest.fn().mockReturnThis(),
            getOne: jest.fn()
        };
    });

    it('debe rechazar si el lote no existe o no esta eliminado', async () => {
      const { restoreLoteService } = await import('../services/loteRecepcion.service.js');
      queryBuilderMock.getOne = jest.fn().mockResolvedValue(null);
      mockQueryRunner.manager.createQueryBuilder = jest.fn().mockReturnValue(queryBuilderMock);

      const [result, error] = await restoreLoteService(1, 'administrador');
      expect(result).toBeNull();
      expect(error).toContain("Lote no encontrado o no está eliminado");
    });

    it('debe rechazar si no es admin', async () => {
      const { restoreLoteService } = await import('../services/loteRecepcion.service.js');
      queryBuilderMock.getOne = jest.fn().mockResolvedValue({ id: 1 });
      mockQueryRunner.manager.createQueryBuilder = jest.fn().mockReturnValue(queryBuilderMock);

      const [result, error] = await restoreLoteService(1, 'operario');
      expect(result).toBeNull();
      expect(error).toContain("Solo administradores pueden restaurar lotes eliminados");
    });

    it('debe restaurar lote exitosamente', async () => {
      const { restoreLoteService } = await import('../services/loteRecepcion.service.js');
      queryBuilderMock.getOne = jest.fn().mockResolvedValue({
          id: 1,
          producciones: [{ id: 1 }],
          productosTerminados: [{ id: 1 }]
      });
      mockQueryRunner.manager.createQueryBuilder = jest.fn().mockReturnValue(queryBuilderMock);

      const [result, error] = await restoreLoteService(1, 'administrador', { email: 'admin' });
      expect(error).toBeNull();
      expect(result.deletedAt).toBeNull();
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
    });
  });

});
