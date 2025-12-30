export default {
  preset: null,
  testEnvironment: 'node',
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  transform: {},
  setupFilesAfterEnv: ['<rootDir>/test/setup.js']
};
