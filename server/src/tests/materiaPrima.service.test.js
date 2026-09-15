import { jest } from '@jest/globals';
import { mockAppDataSource, mockRepository } from './setup/typeorm.mock.js';

// Mock dependencias antes de importar el servicio
jest.unstable_mockModule('../config/configDb.js', () => ({
  AppDataSource: mockAppDataSource,
}));

jest.unstable_mockModule('../entity/materiaPrima.entity.js', () => ({
  default: class MateriaPrima {}
}));

// Importar el servicio a testear de forma asíncrona (requerido para ESM mocks)
const { getMateriasPrimasService, createMateriaPrimaService, updateMateriaPrimaService, deleteMateriaPrimaService } = await import('../services/materiaPrima.service.js');

describe('Materia Prima Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getMateriasPrimasService', () => {
    it('debe retornar lista de materias primas si existen', async () => {
      const mockData = [{ id: 1, nombre: 'Jaiba' }];
      mockRepository.find.mockResolvedValue(mockData);

      const [result, error] = await getMateriasPrimasService();

      expect(error).toBeNull();
      expect(result).toEqual(mockData);
      expect(mockRepository.find).toHaveBeenCalledTimes(1);
    });

    it('debe retornar error si no hay materias primas', async () => {
      mockRepository.find.mockResolvedValue([]);

      const [result, error] = await getMateriasPrimasService();

      expect(result).toBeNull();
      expect(error).toBe("No se encontraron materias primas");
    });

    it('debe capturar y propagar error de DB en getMateriasPrimasService', async () => {
      mockRepository.find.mockRejectedValue(new Error('DB Error'));
      await expect(getMateriasPrimasService()).rejects.toThrow('DB Error');
    });
  });

  describe('createMateriaPrimaService', () => {
    it('debe crear materia prima exitosamente si no existe el nombre', async () => {
      const inputData = { nombre: 'Merluza' };
      const createdRecord = { id: 2, nombre: 'Merluza' };
      
      // Simular que NO existe
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(createdRecord);
      mockRepository.save.mockResolvedValue(createdRecord);

      const [result, error] = await createMateriaPrimaService(inputData);

      expect(error).toBeNull();
      expect(result).toEqual(createdRecord);
      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { nombre: 'Merluza' } });
      expect(mockRepository.save).toHaveBeenCalledTimes(1);
    });

    it('debe retornar error si el nombre ya existe', async () => {
      const inputData = { nombre: 'Jaiba' };
      
      // Simular que SI existe
      mockRepository.findOne.mockResolvedValue({ id: 1, nombre: 'Jaiba' });

      const [result, error] = await createMateriaPrimaService(inputData);

      expect(result).toBeNull();
      expect(error).toBe("El nombre de esta materia prima ya está registrado");
      expect(mockRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('updateMateriaPrimaService', () => {
    it('debe actualizar exitosamente', async () => {
      const mockMp = { id: 1, nombre: 'Jaiba' };
      mockRepository.findOne.mockResolvedValue(mockMp);
      mockRepository.merge.mockImplementation((target, data) => Object.assign(target, data));
      mockRepository.save.mockResolvedValue({ id: 1, nombre: 'Jaiba 2' });

      const [res, err] = await updateMateriaPrimaService(1, { nombre: 'Jaiba 2' });
      expect(err).toBeNull();
      expect(res.nombre).toBe('Jaiba 2');
    });

    it('debe retornar error si no encuentra la materia prima a actualizar', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      const [res, err] = await updateMateriaPrimaService(99, { nombre: 'Nada' });
      expect(err).toBe('Materia Prima no encontrada');
    });
  });

  describe('deleteMateriaPrimaService', () => {
    it('debe eliminar exitosamente', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 1 });
      const [res, err] = await deleteMateriaPrimaService(1);
      expect(err).toBeNull();
      expect(res).toBe(true);
    });

    it('debe retornar error si no encuentra materia prima al eliminar', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 0 });
      const [res, err] = await deleteMateriaPrimaService(99);
      expect(err).toBe('Materia Prima no encontrada');
    });

    it('debe manejar error de foreign key', async () => {
      mockRepository.delete.mockRejectedValue({ code: '23503' });
      const [res, err] = await deleteMateriaPrimaService(1);
      expect(err).toContain('No se puede eliminar: Existen productos asociados');
    });
  });
});
