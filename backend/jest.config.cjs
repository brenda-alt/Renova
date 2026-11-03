const path = require('path');

module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.ts$': path.join(__dirname, 'test', 'ts-transform.cjs'),
  },
  testEnvironment: 'node',
};
