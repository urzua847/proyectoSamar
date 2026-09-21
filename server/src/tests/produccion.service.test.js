import { jest } from '@jest/globals';
import { mockAppDataSource, mockRepository, mockQueryRunner } from './setup/typeorm.mock.js';

// Mock DB
jest.unstable_mockModule('../config/configDb.js', () => ({
  AppDataSource: mockAppDataSource,
}));

// Mock Audit Service
jest.unstable_mockModule('../services/audit.service.js', () => ({
  logCreate: jest.fn(),
  logUpdate: jest.fn()
}));

// Mock Entities
jest.unstable_mockModule('../entity/produccion.entity.js', () => ({ default: class Produccion {} }));
jest.unstable_mockModule('../entity/loteRecepcion.entity.js', () => ({ default: class LoteRecepcion {} }));
jest.unstable_mockModule('../entity/productoTerminado.entity.js', () => ({ default: class ProductoTerminado {} }));

// Import Service
const { 
  createProduccionYieldService,
  getProduccionesByLoteService,
  getProduccionByLoteService,
  updateProduccionYieldService
} = await import('../services/produccion.service.js');

describe('Producción Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createProduccionYieldService', () => {
    it('debe rechazar si el lote no existe', async () => {
      mockQueryRunner.manager.findOne.mockResolvedValue(null);
      const [result, error] = await createProduccionYieldService({ loteRecepcionId: 99 });
      expect(result).toBeNull();
      expect(error).toBe("Lote no encontrado");
    });

    it('debe rechazar si el registro de producción ya existe', async () => {
      mockQueryRunner.manager.findOne.mockResolvedValueOnce({ id: 1 });
      mockQueryRunner.manager.findOne.mockResolvedValueOnce({ id: 100 });
      const [result, error] = await createProduccionYieldService({ loteRecepcionId: 1 });
      expect(result).toBeNull();
      expect(error).toBe("Ya existe un registro de producción para este lote.");
    });

    it('debe rechazar si excede el peso bruto', async () => {
      mockQueryRunner.manager.findOne.mockResolvedValueOnce({ id: 1, peso_bruto_kg: 1000 });
      mockQueryRunner.manager.findOne.mockResolvedValueOnce(null);
      const data = { loteRecepcionId: 1, detalles: [{ peso: 600 }, { peso: 500 }] };
      const [result, error] = await createProduccionYieldService(data);
      expect(result).toBeNull();
      expect(error).toContain("Error de Rendimiento");
    });

    it('debe crear producción exitosamente', async () => {
      mockQueryRunner.manager.findOne.mockResolvedValueOnce({ id: 1, peso_bruto_kg: 1000 });
      mockQueryRunner.manager.findOne.mockResolvedValueOnce(null);
      mockQueryRunner.manager.find.mockResolvedValue([{ peso: 400 }, { peso: 300 }]);
      mockQueryRunner.manager.create.mockReturnValue({ id: 10, total: 700 });
      const data = { loteRecepcionId: 1, detalles: [{ peso: 400 }, { peso: 300 }] };
      const [result, error] = await createProduccionYieldService(data);
      expect(error).toBeNull();
      expect(result.id).toBe(10);
    });
  });

  describe('getProduccionesByLoteService & getProduccionByLoteService', () => {
    it('debe obtener producciones por lote', async () => {
      // getProduccionesByLoteService usa produccionRepository
      mockAppDataSource.getRepository().find.mockResolvedValue([{ id: 1 }]);
      const [result, error] = await getProduccionesByLoteService(1);
      expect(error).toBeNull();
      expect(result.length).toBe(1);
    });

    it('debe obtener una produccion por lote', async () => {
      mockAppDataSource.getRepository().findOne.mockResolvedValue({ id: 1 });
      const [result, error] = await getProduccionByLoteService(1);
      expect(error).toBeNull();
      expect(result.id).toBe(1);
    });
  });

  describe('updateProduccionYieldService', () => {
    it('debe rechazar si la produccion no existe', async () => {
      mockQueryRunner.manager.findOne.mockResolvedValueOnce(null);
      const [result, error] = await updateProduccionYieldService(1, {});
      expect(result).toBeNull();
      expect(error).toBe("No existe registro de producción para este lote.");
    });

    it('debe rechazar si ya fue editada', async () => {
      mockQueryRunner.manager.findOne.mockResolvedValueOnce({ id: 1, editada: true });
      const [result, error] = await updateProduccionYieldService(1, {});
      expect(result).toBeNull();
      expect(error).toContain("Este registro ya fue editado una vez");
    });

    it('debe rechazar si hay productos en camara', async () => {
      mockQueryRunner.manager.findOne.mockResolvedValueOnce({ id: 1, editada: false });
      mockQueryRunner.manager.count.mockResolvedValueOnce(1); // productos en camara
      const [result, error] = await updateProduccionYieldService(1, {});
      expect(result).toBeNull();
      expect(error).toContain("ya existen productos de este lote ingresados en Cámaras");
    });

    it('debe rechazar si excede el rendimiento del lote', async () => {
      mockQueryRunner.manager.findOne.mockResolvedValueOnce({ id: 1, editada: false }); // Produccion
      mockQueryRunner.manager.count.mockResolvedValueOnce(0); // Sin productos en camara
      mockQueryRunner.manager.findOne.mockResolvedValueOnce({ id: 1, peso_bruto_kg: 1000 }); // Lote

      const [result, error] = await updateProduccionYieldService(1, { detalles: [{ peso: 600 }, { peso: 500 }] });
      expect(result).toBeNull();
      expect(error).toContain("Error de Rendimiento");
    });

    it('debe actualizar correctamente', async () => {
      mockQueryRunner.manager.findOne.mockResolvedValueOnce({ id: 1, editada: false }); // Produccion
      mockQueryRunner.manager.count.mockResolvedValueOnce(0); // Sin productos en camara
      mockQueryRunner.manager.findOne.mockResolvedValueOnce({ id: 1, peso_bruto_kg: 1000 }); // Lote

      const [result, error] = await updateProduccionYieldService(1, { detalles: [{ peso: 400 }, { peso: 300 }] });
      expect(error).toBeNull();
      expect(result.editada).toBe(true);
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
    });
  });
});
