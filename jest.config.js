module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/__tests__', '<rootDir>/lib'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/*.test.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  collectCoverageFrom: [
    'lib/**/*.ts',
    '!lib/**/*.d.ts',
  ],
  testPathIgnorePatterns: [
    '/__tests__/db/constructor-demo.ts',
    '/__tests__/db/constructor-verification.md',
    '/__tests__/db/TASK_4_1_COMPLETION_REPORT.md',
  ],
};
