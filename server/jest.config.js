export default {
  testEnvironment: 'node',
  transform: {},
  // Ignoramos temporales y módulos
  testPathIgnorePatterns: ['/node_modules/'],
  // Archivos a ejecutar antes de los tests
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup/typeorm.mock.js'],
  // Recolección de cobertura
  collectCoverageFrom: [
    'src/services/**/*.js',
    '!src/services/**/__tests__/**/*.js',
    '!src/services/audit.service.js'
  ]
};
