// Testes de integração (app -> backend real). Rodam separados dos testes unitários (`npm test`).
module.exports = {
  preset: "jest-expo",
  rootDir: ".",
  testMatch: ["<rootDir>/__integration__/**/*.test.js"],
};
