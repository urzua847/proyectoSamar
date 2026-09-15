import { jest } from '@jest/globals';
export const mockQueryRunner = {
  connect: jest.fn(),
  startTransaction: jest.fn(),
  commitTransaction: jest.fn(),
  rollbackTransaction: jest.fn(),
  release: jest.fn(),
  manager: {
    findOne: jest.fn(),
    find: jest.fn(),
    findByIds: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    count: jest.fn(),
    sum: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    remove: jest.fn(),
  }
};

export const mockRepository = {
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  merge: jest.fn(),
  delete: jest.fn(),
  update: jest.fn(),
  count: jest.fn(),
  sum: jest.fn(),
  remove: jest.fn(),
  createQueryBuilder: jest.fn()
};

export const mockAppDataSource = {
  getRepository: jest.fn(() => mockRepository),
  createQueryRunner: jest.fn(() => mockQueryRunner)
};
