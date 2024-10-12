// tests/dbConnection.test.js
import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer;

describe('Database Connection', () => {
  beforeEach(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  }, 60000); // Optional: Increase timeout if needed

  afterEach(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  }, 60000); // Optional: Increase timeout if needed

  test('should connect to the in-memory database', async () => {
    expect(mongoose.connection.readyState).toBe(1); // 1 means connected
  });
});
