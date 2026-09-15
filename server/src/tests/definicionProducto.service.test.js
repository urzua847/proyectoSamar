import { jest } from '@jest/globals';
import { mockAppDataSource, mockRepository } from './setup/typeorm.mock.js';

jest.unstable_mockModule('../config/configDb.js', () => ({
  AppDataSource: mockAppDataSource,
}));

jest.unstable_mockModule('../entity/definicionProducto.entity.js', () => ({
  default: class DefinicionProducto {}
}));

jest.unstable_mockModule('../entity/materiaPrima.entity.js', () => ({
  default: class MateriaPrima {}
}));

const { createProductoService, getProductosService, updateProductoService, deleteProductoService } = await import('../services/definicionProducto.service.js');

describe('DefinicionProducto Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createProductoService', () => {
    it('debe rechazar si el nombre ya existe', async () => {
      mockRepository.findOne.mockResolvedValue({ id: 1, nombre: 'Caja 5kg' });
      const [result, error] = await createProductoService({ nombre: 'Caja 5kg' });
      expect(result).toBeNull();
      expect(error).toBe("El nombre de este producto ya está registrado");
    });

    it('debe rechazar si la materia prima no existe', async () => {
      mockRepository.findOne
        .mockResolvedValueOnce(null) // nombre
        .mockResolvedValueOnce(null); // materia prima

      const [result, error] = await createProductoService({ nombre: 'Caja', materiaPrimaId: 99 });
      expect(result).toBeNull();
      expect(error).toBe("La materia prima seleccionada no existe");
    });

    it('debe crear exitosamente y formatear calibres', async () => {
      mockRepository.findOne
        .mockResolvedValueOnce(null) // nombre
        .mockResolvedValueOnce({ id: 1, nombre: 'Jaiba' }); // materia prima

      const mockData = { nombre: 'Caja', materiaPrimaId: 1, calibres: 'S, M, L' };
      const created = { id: 10, nombre: 'Caja', calibres: ['S', 'M', 'L'] };
      
      mockRepository.create.mockReturnValue(created);
      
      const [result, error] = await createProductoService(mockData);
      expect(error).toBeNull();
      expect(result).toEqual(created);
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('debe propagar error generico de DB', async () => {
      mockRepository.findOne.mockRejectedValue(new Error('DB Error'));
      await expect(createProductoService({ nombre: 'X' })).rejects.toThrow('DB Error');
    });
  });

  describe('updateProductoService', () => {
    it('debe parsear calibres si se envian como string', async () => {
      mockRepository.findOne.mockResolvedValue({ id: 1, nombre: 'Caja', calibres: [] });
      
      const [result, error] = await updateProductoService(1, { calibres: 'XL, XXL' });
      expect(error).toBeNull();
      expect(result.calibres).toEqual(['XL', 'XXL']);
      expect(mockRepository.save).toHaveBeenCalled();
    });
    it('debe asignar arreglo de calibres directamente', async () => {
      mockRepository.findOne.mockResolvedValue({ id: 1, nombre: 'Caja' });
      const [result, error] = await updateProductoService(1, { calibres: ['10', '20'] });
      expect(error).toBeNull();
      expect(result.calibres).toEqual(['10', '20']);
    });

    it('debe asignar null si calibres es de otro tipo', async () => {
      mockRepository.findOne.mockResolvedValue({ id: 1, nombre: 'Caja' });
      const [result, error] = await updateProductoService(1, { calibres: 123 });
      expect(error).toBeNull();
      expect(result.calibres).toBeNull();
    });

    it('debe retornar error si el producto no existe', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      const [result, error] = await updateProductoService(99, { nombre: 'Nada' });
      expect(error).toBe("Producto no encontrado");
    });

    it('debe capturar error de DB al actualizar', async () => {
      mockRepository.findOne.mockRejectedValue(new Error('DB Error'));
      const [result, error] = await updateProductoService(1, { nombre: 'Nada' });
      expect(error).toBe('DB Error');
    });
  });

  describe('getProductosService', () => {
    it('debe retornar lista de productos', async () => {
      mockRepository.find.mockResolvedValue([{ id: 1 }]);
      const [res, err] = await getProductosService();
      expect(err).toBeNull();
      expect(res.length).toBe(1);
    });

    it('debe retornar error si no hay productos', async () => {
      mockRepository.find.mockResolvedValue([]);
      const [res, err] = await getProductosService();
      expect(res).toBeNull();
      expect(err).toBe("No se encontraron productos definidos");
    });

    it('debe capturar y propagar error de DB', async () => {
      mockRepository.find.mockRejectedValue(new Error('DB Error'));
      await expect(getProductosService()).rejects.toThrow('DB Error');
    });
  });

  describe('deleteProductoService', () => {
    it('debe eliminar exitosamente', async () => {
      const mockProd = { id: 1 };
      mockRepository.findOne.mockResolvedValue(mockProd);
      mockRepository.remove.mockResolvedValue(mockProd);
      const [res, err] = await deleteProductoService(1);
      expect(err).toBeNull();
      expect(res).toBe(true);
    });

    it('debe retornar error si no existe al eliminar', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      const [res, err] = await deleteProductoService(99);
      expect(err).toBe("Producto no encontrado");
    });

    it('debe manejar error de foreign key', async () => {
      mockRepository.findOne.mockResolvedValue({ id: 1 });
      mockRepository.remove.mockRejectedValue({ code: '23503' });
      const [res, err] = await deleteProductoService(1);
      expect(err).toContain("El producto está siendo utilizado");
    });

    it('debe manejar error generico', async () => {
      mockRepository.findOne.mockResolvedValue({ id: 1 });
      mockRepository.remove.mockRejectedValue(new Error('Generic Error'));
      const [res, err] = await deleteProductoService(1);
      expect(err).toBe('Generic Error');
    });
  });
});
