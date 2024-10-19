const { faker } = require('@faker-js/faker');

function generateUser() {
  return {
    username: faker.internet.userName(),
    email: faker.internet.email(),
    password: 'Password123!',
    phone: faker.phone.number(),
  };
}

module.exports = {
  generateUser,
};
