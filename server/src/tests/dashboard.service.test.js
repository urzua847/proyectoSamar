import { jest } from '@jest/globals';
import { mockAppDataSource, mockRepository } from './setup/typeorm.mock.js';

jest.unstable_mockModule('../config/configDb.js', () => ({
  AppDataSource: mockAppDataSource,
}));

jest.unstable_mockModule('../services/envasado.service.js', () => ({
  getDashboardStockCamarasService: jest.fn(),
  getDashboardStockContenedoresService: jest.fn(),
}));

jest.unstable_mockModule('../entity/loteRecepcion.entity.js', () => ({ default: class LoteRecepcion {} }));

const { getDashboardDataService } = await import('../services/dashboard.service.js');
const envasadoService = await import('../services/envasado.service.js');

describe('Dashboard Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getDashboardDataService', () => {
    it('debe devolver todos los datos consolidados', async () => {
      mockRepository.find.mockResolvedValueOnce([{ id: 1 }]); // ultimosLotes
      envasadoService.getDashboardStockCamarasService.mockResolvedValueOnce([[{ id: 1, cantidad: 10 }], null]);
      envasadoService.getDashboardStockContenedoresService.mockResolvedValueOnce([[{ id: 1, cantidad: 20 }], null]);

      const [result, error] = await getDashboardDataService();
      
      expect(error).toBeNull();
      expect(result.ultimosLotes.length).toBe(1);
      expect(result.stockCamaras.length).toBe(1);
      expect(result.stockContenedores.length).toBe(1);
    });

    it('debe devolver error si falla obtener stock en camaras', async () => {
      mockRepository.find.mockResolvedValueOnce([]); // ultimosLotes
      envasadoService.getDashboardStockCamarasService.mockResolvedValueOnce([null, 'Error simulado camaras']);

      const [result, error] = await getDashboardDataService();
      
      expect(result).toBeNull();
      expect(error).toBe('Error simulado camaras');
    });
  });
});
