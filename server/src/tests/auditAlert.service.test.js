import { jest } from '@jest/globals';
import { mockAppDataSource, mockRepository } from './setup/typeorm.mock.js';

jest.unstable_mockModule('../config/configDb.js', () => ({
  AppDataSource: mockAppDataSource,
}));

jest.unstable_mockModule('../entity/auditLog.entity.js', () => ({ default: class AuditLog {} }));

const { detectSuspiciousActivity, getActivityStats } = await import('../services/auditAlert.service.js');

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
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
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

    it('debe detectar RAPID_ACTIONS', async () => {
      queryBuilderMock.getMany.mockResolvedValue([]);
      queryBuilderMock.getRawMany.mockResolvedValueOnce([{ userId: 1, userName: 'Bot', count: 40 }]);

      const result = await detectSuspiciousActivity();
      const alert = result.find(a => a.type === 'RAPID_ACTIONS');
      expect(alert).toBeDefined();
      expect(alert.userName).toBe('Bot');
    });

    it('debe detectar OFF_HOURS_ACTIVITY y EXCESSIVE_RESTORES', async () => {
      // Mock Date.getHours to return 23 (11 PM, off hours)
      const originalGetHours = Date.prototype.getHours;
      Date.prototype.getHours = jest.fn(() => 23);

      queryBuilderMock.getMany
        .mockResolvedValueOnce([]) // Rule 1
        .mockResolvedValueOnce(Array(1).fill({ action: 'SOFT_DELETE' })) // Rule 3 (off hours)
        .mockResolvedValueOnce(Array(6).fill({ action: 'RESTORE' })); // Rule 4 (restores)
      queryBuilderMock.getRawMany.mockResolvedValueOnce([]); // Rule 2

      const result = await detectSuspiciousActivity();
      
      const offHoursAlert = result.find(a => a.type === 'OFF_HOURS_ACTIVITY');
      expect(offHoursAlert).toBeDefined();

      const restoreAlert = result.find(a => a.type === 'EXCESSIVE_RESTORES');
      expect(restoreAlert).toBeDefined();

      // Restore Date.getHours
      Date.prototype.getHours = originalGetHours;
    });

    it('debe capturar error', async () => {
      queryBuilderMock.getMany.mockRejectedValue(new Error('DB Error'));
      const result = await detectSuspiciousActivity();
      expect(result).toEqual([]);
    });
  });

  describe('getActivityStats', () => {
    it('debe devolver estadisticas correctamente', async () => {
      queryBuilderMock.getRawMany
        .mockResolvedValueOnce([{ action: 'LOGIN', count: 5 }]) // last24Hours
        .mockResolvedValueOnce([{ userName: 'Admin', count: 10 }]) // topUsers
        .mockResolvedValueOnce([{ date: '2023-10-01', count: 15 }]); // dailyActions

      const result = await getActivityStats();
      expect(result.last24Hours).toBeDefined();
      expect(result.topUsers).toBeDefined();
      expect(result.dailyActions).toBeDefined();
      expect(result.last24Hours[0].action).toBe('LOGIN');
    });

    it('debe capturar error y devolver null', async () => {
      queryBuilderMock.getRawMany.mockRejectedValue(new Error('DB Error'));
      const result = await getActivityStats();
      expect(result).toBeNull();
    });
  });
});
