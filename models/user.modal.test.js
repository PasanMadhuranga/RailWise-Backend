import { describe, test, expect, beforeEach, afterEach } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import bcrypt from "bcryptjs";
import User from "./user.model";  // Adjust the import based on your project structure

let mongoServer;

beforeEach(async () => {
  // Set up in-memory MongoDB
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  
});

afterEach(async () => {
  // Clean up
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe("User model tests", () => {

  test("should not allow creating users with the same username", async () => {
    // Create a user
    const user1 = await User.create({ 
      username: "testuser", 
      email: "user1@example.com", 
      password: "password123", 
      phone: "1234567890" 
    });

    // Try to create another user with the same username
    try {
      await User.create({ 
        username: "testuser",  // Same username
        email: "user2@example.com", 
        password: "password456", 
        phone: "0987654321" 
      });
    } catch (err) {
      expect(err).toBeTruthy();
      expect(err.code).toBe(11000);  // 11000 is the error code for duplicate keys in MongoDB
    }
  });

  test("should not allow creating users with the same email", async () => {
    // Create a user
    const user1 = await User.create({ 
      username: "user1", 
      email: "test@example.com", 
      password: "password123", 
      phone: "1234567890" 
    });

    // Try to create another user with the same email
    try {
      await User.create({ 
        username: "user2", 
        email: "test@example.com",  // Same email
        password: "password456", 
        phone: "0987654321" 
      });
    } catch (err) {
      expect(err).toBeTruthy();
      expect(err.code).toBe(11000);  // 11000 is the error code for duplicate keys in MongoDB
    }
  });

  test("should hash the password before saving the user", async () => {
    const password = "plainpassword";
    
    // Create a new user
    const user = await User.create({
      username: "hashTestUser",
      email: "hashuser@example.com",
      password: password,  // Plain password
      phone: "1234567890"
    });

    // Ensure the password stored in the DB is hashed
    expect(user.password).not.toBe(password);
    
    // Verify the password is hashed correctly
    const isMatch = await bcrypt.compare(password, user.password);
    expect(isMatch).toBe(true);  // Password should match when hashed
  });

});
