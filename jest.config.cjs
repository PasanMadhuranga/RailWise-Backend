// jest.config.cjs
module.exports = {
  transform: {
    "^.+\\.js$": "babel-jest", // Transforms JS files using babel-jest
  },
  testEnvironment: "node",       // Sets the test environment to Node.js
  moduleFileExtensions: ["js"],
  globals: {
    "babel-jest": {
      useESM: true,               // Informs babel-jest to handle ES modules
    },
  },
};