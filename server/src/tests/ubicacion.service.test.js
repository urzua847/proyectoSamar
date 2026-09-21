import { jest } from '@jest/globals';
import { mockAppDataSource, mockRepository } from './setup/typeorm.mock.js';

jest.unstable_mockModule('../config/configDb.js', () => ({
  AppDataSource: mockAppDataSource,
}));

jest.unstable_mockModule('../entity/ubicacion.entity.js', () => ({ default: class Ubicacion {} }));

const { getUbicacionesService, createUbicacionService } = await import('../services/ubicacion.service.js');

describe('Ubicacion Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createUbicacionService', () => {
    it('debe rechazar si la ubicacion ya existe', async () => {
      mockRepository.findOne.mockResolvedValueOnce({ id: 1, nombre: 'Camara 1' });
      const [result, error] = await createUbicacionService({ nombre: 'Camara 1', tipo: 'camara' });
      expect(result).toBeNull();
      expect(error).toBe("La ubicación ya existe");
    });

    it('debe crear exitosamente', async () => {
      mockRepository.findOne.mockResolvedValueOnce(null);
      mockRepository.create.mockReturnValueOnce({ id: 10, nombre: 'Camara 1', tipo: 'camara' });

      const [result, error] = await createUbicacionService({ nombre: 'Camara 1', tipo: 'camara' });
      expect(error).toBeNull();
      expect(result.id).toBe(10);
      expect(mockRepository.save).toHaveBeenCalled();
    });
    it('debe capturar error en createUbicacionService', async () => {
      mockRepository.findOne.mockRejectedValue(new Error('DB Error Create'));
      await expect(createUbicacionService({ nombre: 'Camara' })).rejects.toThrow('DB Error Create');
    });
  });

  describe('getUbicacionesService', () => {
    it('debe listar ubicaciones exitosamente', async () => {
      const mockData = [{ id: 1, nombre: 'Ubicacion 1' }];
      mockRepository.find.mockResolvedValueOnce(mockData);
      
      const [result, error] = await getUbicacionesService();
      expect(error).toBeNull();
      expect(result).toEqual(mockData);
    });

    it('debe retornar mensaje si no hay ubicaciones', async () => {
      mockRepository.find.mockResolvedValueOnce([]);
      
      const [result, error] = await getUbicacionesService();
      expect(result).toBeNull();
      expect(error).toBe('No hay ubicaciones');
    });

    it('debe capturar error de base de datos', async () => {
      mockRepository.find.mockRejectedValue(new Error('DB Error Get'));
      
      await expect(getUbicacionesService()).rejects.toThrow('DB Error Get');
    });
  });
});
