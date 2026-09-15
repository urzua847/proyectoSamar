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
  });
});
