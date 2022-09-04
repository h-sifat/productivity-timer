const { pathsToModuleNameMapper } = require("ts-jest");
const { compilerOptions } = require("./tsconfig.json");

const { baseUrl, paths } = compilerOptions;

module.exports = {
  preset: "ts-jest",
  roots: ["<rootDir>/tests/", "<rootDir>/src/"],
  testEnvironment: "node",
  transform: {
    "^.+\\.tsx?$": "ts-jest",
  },
  modulePaths: [baseUrl],
  moduleNameMapper: pathsToModuleNameMapper(paths),
  setupFilesAfterEnv: ["<rootDir>/tests/jest.setup.ts"],
};
