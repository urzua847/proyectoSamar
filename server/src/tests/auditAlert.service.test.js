import { jest } from '@jest/globals';
import { mockAppDataSource, mockRepository } from './setup/typeorm.mock.js';

jest.unstable_mockModule('../config/configDb.js', () => ({
  AppDataSource: mockAppDataSource,
}));

jest.unstable_mockModule('../entity/auditLog.entity.js', () => ({ default: class AuditLog {} }));

const { detectSuspiciousActivity } = await import('../services/auditAlert.service.js');

describe('Audit Alert Service', () => {
  let queryBuilderMock;

  beforeEach(() => {
    jest.clearAllMocks();

    queryBuilderMock = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      addGroupBy: jest.fn().mockReturnThis(),
      having: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
      getRawMany: jest.fn()
    };

    mockRepository.createQueryBuilder = jest.fn().mockReturnValue(queryBuilderMock);
  });

  describe('detectSuspiciousActivity', () => {
    it('debe devolver array vacio si no hay alertas', async () => {
      queryBuilderMock.getMany.mockResolvedValue([]);
      queryBuilderMock.getRawMany.mockResolvedValue([]);

      const result = await detectSuspiciousActivity();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it('debe detectar EXCESSIVE_DELETES', async () => {
      // Return 11 deletes to trigger
      queryBuilderMock.getMany
        .mockResolvedValueOnce(Array(11).fill({ userName: 'Admin' })) // Rule 1
        .mockResolvedValueOnce([]) // Rule 3 (off hours)
        .mockResolvedValueOnce([]); // Rule 4 (restores)
        
      queryBuilderMock.getRawMany.mockResolvedValueOnce([]); // Rule 2

      const result = await detectSuspiciousActivity();
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].type).toBe('EXCESSIVE_DELETES');
    });
  });
});
