import { jest } from '@jest/globals';
import { mockAppDataSource, mockRepository } from './setup/typeorm.mock.js';

jest.unstable_mockModule('../config/configDb.js', () => ({
  AppDataSource: mockAppDataSource,
}));

jest.unstable_mockModule('../entity/entidad.entity.js', () => ({
  default: class Entidad {}
}));

const { getEntidadesService, getEntidadByIdService, createEntidadService, updateEntidadService, deleteEntidadService } = await import('../services/entidad.service.js');

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
      expect(mockRepository.find).toHaveBeenCalledWith({ where: { tipo: 'proveedor' }, order: { nombre: 'ASC' } });
    });

    it('debe retornar mensaje si no hay entidades', async () => {
      mockRepository.find.mockResolvedValue([]);
      const [result, error] = await getEntidadesService();
      expect(result).toBeNull();
      expect(error).toBe("No se encontraron entidades");
    });

    it('debe capturar error de base de datos', async () => {
      mockRepository.find.mockRejectedValue(new Error('DB Error getEntidades'));
      await expect(getEntidadesService()).rejects.toThrow('DB Error getEntidades');
    });
  });

  describe('getEntidadByIdService', () => {
    it('debe retornar entidad si existe', async () => {
      mockRepository.findOne.mockResolvedValue({ id: 1, nombre: 'Samar' });
      const [result, error] = await getEntidadByIdService(1);
      expect(error).toBeNull();
      expect(result.id).toBe(1);
    });

    it('debe retornar error si no existe', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      const [result, error] = await getEntidadByIdService(99);
      expect(result).toBeNull();
      expect(error).toBe("Entidad no encontrada");
    });

    it('debe capturar error de base de datos', async () => {
      mockRepository.findOne.mockRejectedValue(new Error('DB Error getEntidadById'));
      await expect(getEntidadByIdService(1)).rejects.toThrow('DB Error getEntidadById');
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

    it('debe capturar error de base de datos', async () => {
      mockRepository.findOne.mockRejectedValue(new Error('DB Error Create'));
      await expect(createEntidadService({ nombre: 'A', rut: 'B' }, 'proveedor')).rejects.toThrow('DB Error Create');
    });
  });

  describe('updateEntidadService', () => {
    it('debe actualizar exitosamente', async () => {
      const mockEntidad = { id: 1, nombre: 'Viejo' };
      mockRepository.findOne.mockResolvedValue(mockEntidad);
      mockRepository.merge = jest.fn((entity, data) => Object.assign(entity, data));
      
      const [result, error] = await updateEntidadService(1, { nombre: 'Nuevo' });
      expect(error).toBeNull();
      expect(result.nombre).toBe('Nuevo');
      expect(mockRepository.save).toHaveBeenCalledWith(result);
    });

    it('debe rechazar si no encuentra la entidad', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      const [result, error] = await updateEntidadService(99, { nombre: 'Nuevo' });
      expect(result).toBeNull();
      expect(error).toBe("Entidad no encontrada");
    });

    it('debe capturar error de base de datos', async () => {
      mockRepository.findOne.mockRejectedValue(new Error('DB Error Update'));
      await expect(updateEntidadService(1, { nombre: 'Nuevo' })).rejects.toThrow('DB Error Update');
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
      expect(error).toBeNull();
      expect(result).toBe(true);
      expect(mockRepository.remove).toHaveBeenCalledWith(mockEntidad);
    });

    it('debe capturar error de base de datos', async () => {
      mockRepository.findOne.mockRejectedValue(new Error('DB Error Delete'));
      const [result, error] = await deleteEntidadService(1);
      expect(result).toBeNull();
      expect(error).toBe('DB Error Delete');
    });
  });
});
