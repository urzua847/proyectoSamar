import { jest } from '@jest/globals';
import { mockAppDataSource, mockRepository } from './setup/typeorm.mock.js';

jest.unstable_mockModule('../config/configDb.js', () => ({
  AppDataSource: mockAppDataSource,
}));

jest.unstable_mockModule('../entity/entidad.entity.js', () => ({
  default: class Entidad {}
}));

const { getEntidadesService, createEntidadService, updateEntidadService, deleteEntidadService } = await import('../services/entidad.service.js');

describe('Entidad Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getEntidadesService', () => {
    it('debe listar entidades filtradas por tipo si se especifica', async () => {
      mockRepository.find.mockResolvedValue([{ id: 1, nombre: 'Samar', tipo: 'proveedor' }]);
      const [result, error] = await getEntidadesService('proveedor');
      expect(error).toBeNull();
      expect(result.length).toBe(1);
      expect(mockRepository.find).toHaveBeenCalledWith({ where: { tipo: 'proveedor' }, order: { nombre: 'ASC' } });
    });
  });

  describe('createEntidadService', () => {
    it('debe rechazar si el RUT o Nombre ya existen', async () => {
      mockRepository.findOne.mockResolvedValue({ id: 1, rut: '123' });
      const [result, error] = await createEntidadService({ nombre: 'Nuevo', rut: '123' }, 'cliente');
      expect(result).toBeNull();
      expect(error).toBe("La entidad ya existe (Nombre o RUT duplicado)");
    });

    it('debe crear exitosamente asignando el discriminador (tipo)', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      const mockCreated = { id: 2, nombre: 'A', rut: 'B', tipo: 'proveedor' };
      mockRepository.create.mockReturnValue(mockCreated);
      
      const [result, error] = await createEntidadService({ nombre: 'A', rut: 'B' }, 'proveedor');
      expect(error).toBeNull();
      expect(result).toEqual(mockCreated);
      expect(mockRepository.save).toHaveBeenCalled();
    });
  });

  describe('deleteEntidadService', () => {
    it('debe rechazar si no encuentra la entidad a eliminar', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      const [result, error] = await deleteEntidadService(99);
      expect(result).toBeNull();
      expect(error).toBe("Entidad no encontrada");
    });

    it('debe eliminar exitosamente', async () => {
      const mockEntidad = { id: 1 };
      mockRepository.findOne.mockResolvedValue(mockEntidad);
      mockRepository.remove.mockResolvedValue(mockEntidad);

      const [result, error] = await deleteEntidadService(1);
      expect(error).toBeNull();
      expect(result).toBe(true);
      expect(mockRepository.remove).toHaveBeenCalledWith(mockEntidad);
    });
  });
});
