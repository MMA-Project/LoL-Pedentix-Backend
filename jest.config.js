/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testMatch: ["**/__tests__/**/*.[jt]s?(x)", "**/?(*.)+(spec|test).[tj]s?(x)"],
  moduleFileExtensions: ["ts", "js", "json"],
  collectCoverage: true,
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov"],
};
