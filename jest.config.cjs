module.exports = {
  transform: {
    "^.+\\.js$": "babel-jest", 
  },
  testEnvironment: "node",       
  moduleFileExtensions: ["js"],
  globals: {
    "babel-jest": {
      useESM: true,              
    },
  },
};