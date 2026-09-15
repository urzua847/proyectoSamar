import { jest } from '@jest/globals';
import { mockAppDataSource, mockQueryRunner, mockRepository } from './setup/typeorm.mock.js';

// Mocks TypeORM
jest.unstable_mockModule('../config/configDb.js', () => ({
  AppDataSource: mockAppDataSource,
}));

jest.unstable_mockModule('../services/audit.service.js', () => ({
  logCreate: jest.fn(),
  logUpdate: jest.fn(),
}));

// Mock Entidades
jest.unstable_mockModule('../entity/productoTerminado.entity.js', () => ({ default: class ProductoTerminado {} }));
jest.unstable_mockModule('../entity/loteRecepcion.entity.js', () => ({ default: class LoteRecepcion {} }));
jest.unstable_mockModule('../entity/definicionProducto.entity.js', () => ({ default: class DefinicionProducto {} }));
jest.unstable_mockModule('../entity/ubicacion.entity.js', () => ({ default: class Ubicacion {} }));

// Import del servicio
const { 
  createProduccionService, 
  deleteManyProduccionService,
  getStockCamarasService,
  getStockContenedoresService,
  getProduccionesService,
  getResumenProduccionByLoteService,
  getDashboardStockCamarasService,
  getDashboardStockContenedoresService
} = await import('../services/envasado.service.js');

describe('Envasado Service', () => {
  let queryBuilderMock;

  beforeEach(() => {
    jest.clearAllMocks();

    queryBuilderMock = {
      leftJoin: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      addGroupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      offset: jest.fn().mockReturnThis(),
      getCount: jest.fn(),
      getRawMany: jest.fn(),
      getRawOne: jest.fn(),
      getMany: jest.fn(),
      getOne: jest.fn()
    };

    // Simulamos el getRepository().createQueryBuilder() de TypeORM
    mockQueryRunner.manager.getRepository = jest.fn().mockReturnValue({
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilderMock)
    });
    mockRepository.createQueryBuilder = jest.fn().mockReturnValue(queryBuilderMock);
    mockRepository.findOne = jest.fn();
  });

  describe('createProduccionService', () => {
    it('debe rechazar si el lote de recepcion no existe', async () => {
      mockQueryRunner.manager.findOne.mockResolvedValue(null);
      const [result, error] = await createProduccionService({ loteRecepcionId: 1, items: [] });
      expect(result).toBeNull();
      expect(error).toBe("El Lote de Recepción no existe.");
    });

    it('debe rechazar si el lote esta cerrado', async () => {
      mockQueryRunner.manager.findOne.mockResolvedValue({ id: 1, estado: false });
      const [result, error] = await createProduccionService({ loteRecepcionId: 1, items: [] });
      expect(result).toBeNull();
      expect(error).toBe("El Lote está CERRADO.");
    });

    it('debe rechazar si excede el limite de PINZAS', async () => {
      mockQueryRunner.manager.findOne.mockResolvedValue({ id: 1, estado: true, peso_pinzas: 100 });
      mockQueryRunner.manager.findByIds = jest.fn().mockResolvedValue([{ id: 10, origen: 'pinza' }]);
      mockAppDataSource.getRepository().createQueryBuilder = jest.fn().mockReturnValue(queryBuilderMock);
      queryBuilderMock.getRawOne.mockResolvedValue({ sum: '80' });

      const payload = { loteRecepcionId: 1, items: [{ definicionProductoId: 10, peso_neto_kg: 30 }] };
      const [result, error] = await createProduccionService(payload);

      expect(result).toBeNull();
      expect(error).toContain("excede el límite de PINZAS");
    });

    it('debe rechazar si excede el limite de CARNE BLANCA', async () => {
      mockQueryRunner.manager.findOne.mockResolvedValue({ id: 1, estado: true, peso_carne_blanca: 100 });
      mockQueryRunner.manager.findByIds = jest.fn().mockResolvedValue([{ id: 10, origen: 'carne blanca' }]);
      mockAppDataSource.getRepository().createQueryBuilder = jest.fn().mockReturnValue(queryBuilderMock);
      queryBuilderMock.getRawOne.mockResolvedValue({ sum: '80' });

      const payload = { loteRecepcionId: 1, items: [{ definicionProductoId: 10, peso_neto_kg: 30 }] };
      const [result, error] = await createProduccionService(payload);

      expect(result).toBeNull();
      expect(error).toContain("excede el límite de CARNE BLANCA");
    });

    it('debe rechazar si una definicion es invalida', async () => {
      mockQueryRunner.manager.findOne
        .mockResolvedValueOnce({ id: 1, estado: true }) // lote
        .mockResolvedValueOnce(null); // definicion

      mockQueryRunner.manager.findByIds = jest.fn().mockResolvedValue([]);

      const payload = { loteRecepcionId: 1, items: [{ definicionProductoId: 99, peso_neto_kg: 10 }] };
      const [result, error] = await createProduccionService(payload);

      expect(result).toBeNull();
      expect(error).toContain("Producto ID 99 inválido");
    });

    it('debe rechazar si la ubicacion es invalida', async () => {
      mockQueryRunner.manager.findOne
        .mockResolvedValueOnce({ id: 1, estado: true }) // lote
        .mockResolvedValueOnce({ id: 10 }) // definicion
        .mockResolvedValueOnce(null); // ubicacion

      mockQueryRunner.manager.findByIds = jest.fn().mockResolvedValue([{ id: 10 }]);

      const payload = { loteRecepcionId: 1, items: [{ definicionProductoId: 10, ubicacionId: 99, peso_neto_kg: 10 }] };
      const [result, error] = await createProduccionService(payload);

      expect(result).toBeNull();
      expect(error).toContain("Ubicación ID 99 inválida");
    });

    it('debe envasar y cerrar el lote correctamente', async () => {
      mockQueryRunner.manager.findOne
        .mockResolvedValueOnce({ id: 1, estado: true }) // lote
        .mockResolvedValueOnce({ id: 10, nombre: 'A', calibres: ['S'] }) // definicion
        .mockResolvedValueOnce({ id: 20, nombre: 'Camara' }); // ubicacion

      mockQueryRunner.manager.findByIds = jest.fn().mockResolvedValue([{ id: 10 }]);
      mockQueryRunner.manager.create = jest.fn().mockReturnValue({ definicion: { nombre: 'A' }, ubicacion: { nombre: 'Camara' } });

      const payload = { loteRecepcionId: 1, items: [{ definicionProductoId: 10, ubicacionId: 20, peso_neto_kg: 10, calibre: 'S' }], cerrar_lote: true, merma_kg: 5 };
      const [result, error] = await createProduccionService(payload);

      expect(error).toBeNull();
      expect(result.length).toBe(1);
      expect(mockQueryRunner.manager.save).toHaveBeenCalled();
    });
  });

  describe('deleteManyProduccionService', () => {
    it('debe desembalar cajas a camara creando los registros originales', async () => {
      const mockCajas = [
        { id: 1, peso_neto_kg: 10, piezas_internas: 20, ubicacion: { tipo: 'contenedor' }, loteDeOrigen: { id: 100 }, definicion: { id: 200 }, calibre: 'S' }
      ];

      queryBuilderMock.getMany = jest.fn().mockResolvedValue(mockCajas);
      mockQueryRunner.manager.createQueryBuilder = jest.fn().mockReturnValue(queryBuilderMock);

      const mockDefaultCamera = { id: 1, nombre: 'Cámara 0', tipo: 'camara' };
      mockQueryRunner.manager.findOne = jest.fn().mockResolvedValue(mockDefaultCamera);
      mockQueryRunner.manager.delete = jest.fn().mockResolvedValue(true);
      mockQueryRunner.manager.save = jest.fn().mockResolvedValue(true);
      mockQueryRunner.manager.create = jest.fn().mockReturnValue({ peso_neto_kg: 0.5, piezas_internas: 1 });

      const [result, error] = await deleteManyProduccionService([1]);

      expect(error).toBeNull();
      expect(result).toBe(true);
      // Verify the box was deleted
      expect(mockQueryRunner.manager.delete).toHaveBeenCalledWith(
          expect.anything(),
          [1]
      );
      // Verify 20 items were recreated
      expect(mockQueryRunner.manager.create).toHaveBeenCalledTimes(20);
      expect(mockQueryRunner.manager.save).toHaveBeenCalled();
    });

    it('debe eliminar permanentemente si ya estaba en una camara', async () => {
      const mockCajas = [
        { id: 2, peso_neto_kg: 10, ubicacion: { tipo: 'camara' } }
      ];

      queryBuilderMock.getMany = jest.fn().mockResolvedValue(mockCajas);
      mockQueryRunner.manager.createQueryBuilder = jest.fn().mockReturnValue(queryBuilderMock);

      mockQueryRunner.manager.delete = jest.fn().mockResolvedValue(true);

      const [result, error] = await deleteManyProduccionService([2]);

      expect(error).toBeNull();
      expect(result).toBe(true);
      expect(mockQueryRunner.manager.delete).toHaveBeenCalledWith(
          expect.anything(),
          [2]
      );
    });
  });

  describe('getStockCamarasService', () => {
    it('debe obtener el stock agrupado', async () => {
      queryBuilderMock.getRawMany.mockResolvedValue([{ ubicacionNombre: 'Camara 1', totalKilos: 10 }]);
      const [result, error] = await getStockCamarasService();
      expect(error).toBeNull();
      expect(result[0].ubicacionNombre).toBe('Camara 1');
    });
  });

  describe('getStockContenedoresService', () => {
    it('debe obtener el stock de contenedores', async () => {
      queryBuilderMock.getRawMany.mockResolvedValue([{ contenedorId: 1, totalKilos: 20 }]);
      const [result, error] = await getStockContenedoresService();
      expect(error).toBeNull();
      expect(result[0].contenedorId).toBe(1);
    });
  });

  describe('getProduccionesService', () => {
    it('debe devolver items paginados', async () => {
      queryBuilderMock.getCount.mockResolvedValue(10);
      queryBuilderMock.getRawMany.mockResolvedValue([{ id: 1, cantidad: '5' }]);
      
      const [result, error] = await getProduccionesService({ page: 1, limit: 10 });
      expect(error).toBeNull();
      expect(result.data.length).toBe(1);
      expect(result.pagination.totalItems).toBe(10);
    });
  });

  describe('getResumenProduccionByLoteService', () => {
    it('debe obtener el resumen y balance del lote', async () => {
      mockRepository.findOne.mockResolvedValue({ id: 1, peso_carne_blanca: 100, peso_pinzas: 50, merma_kg: 5, estado: 'Abierto' });
      queryBuilderMock.getRawOne
        .mockResolvedValueOnce({ total: '40' }) // carne
        .mockResolvedValueOnce({ total: '10' }); // pinza
        
      const [result, error] = await getResumenProduccionByLoteService(1);
      expect(error).toBeNull();
      expect(result.balance.carne).toBe(60); // 100 - 40
      expect(result.balance.pinzas).toBe(40); // 50 - 10
    });
  });

  describe('getDashboardStockCamarasService', () => {
    it('debe devolver stock de dashboard camaras', async () => {
      queryBuilderMock.getRawMany.mockResolvedValue([{ productoNombre: 'A', totalKilos: 50 }]);
      const [result, error] = await getDashboardStockCamarasService();
      expect(error).toBeNull();
      expect(result[0].productoNombre).toBe('A');
    });
  });

  describe('getDashboardStockContenedoresService', () => {
    it('debe devolver stock de dashboard contenedores', async () => {
      queryBuilderMock.getRawMany.mockResolvedValue([{ ubicacionNombre: 'Cont', totalKilos: 50 }]);
      const [result, error] = await getDashboardStockContenedoresService();
      expect(error).toBeNull();
      expect(result[0].ubicacionNombre).toBe('Cont');
    });
  });
});
