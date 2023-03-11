const { pathsToModuleNameMapper } = require("ts-jest");
const { compilerOptions } = require("./tsconfig.json");
const { baseUrl, paths } = compilerOptions;
const packageJSON = require("./package.json");

/** @type {import('jest').Config} */
const config = {
  preset: "ts-jest",
  globals: {
    __BUILD_MODE__: "development",
    __APP_VERSION__: packageJSON.version,
  },
  roots: ["<rootDir>/tests/", "<rootDir>/src/"],
  testEnvironment: "node",
  transform: {
    "^.+\\.tsx?$": "ts-jest",
  },
  modulePaths: [baseUrl],
  moduleNameMapper: pathsToModuleNameMapper(paths),
  setupFilesAfterEnv: ["<rootDir>/tests/jest.setup.ts"],
  maxWorkers: "40%",
};

module.exports = config;
