// tests/userApi.test.js
import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import supertest from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser'; 
import userRouter from './user.route.js'; 
import dotenv from 'dotenv';

dotenv.config();
// Initialize Express app for testing
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/api/users', userRouter);

// Global error handler for testing
app.use((err, req, res, next) => {
  res.status(err.status || 500).json({ message: err.message });
});

const request = supertest(app);

let mongoServer;

describe('User API Endpoints', () => {
  beforeEach(async () => {
    // Start in-memory MongoDB instance
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  }, 60000); // Increase timeout if needed

  afterEach(async () => {
    // Disconnect and stop in-memory MongoDB
    await mongoose.disconnect();
    await mongoServer.stop();
  }, 60000); // Increase timeout if needed

  // test('POST /api/users/register - should register a new user', async () => {
  //   const newUser = {
  //     username: 'testuser',
  //     email: 'testuser@example.com',
  //     password: 'password123',
  //     phone: '1234567890',
  //   };

  //   const response = await request.post('/api/users/register').send(newUser);
    

  //   expect(response.status).toBe(200); , it's 200
  //   expect(response.body).toHaveProperty('username', newUser.username);
  //   expect(response.body).toHaveProperty('email', newUser.email);
  //   expect(response.body).not.toHaveProperty('password'); // Password should not be returned

  //   // Check if the cookie is set
  //   const cookies = response.headers['set-cookie'];
  //   expect(cookies).toBeDefined();
  //   expect(cookies.some(cookie => cookie.startsWith('access_token='))).toBe(true);
  // });

  test('POST /api/users/register - should not allow duplicate usernames', async () => {
    const user1 = {
      username: 'duplicateuser',
      email: 'user1@example.com',
      password: 'password123',
      phone: '1234567890',
    };

    const user2 = {
      username: 'duplicateuser', // Same username
      email: 'user2@example.com',
      password: 'password456',
      phone: '0987654321',
    };

    // Create the first user
    await request.post('/api/users/register').send(user1);

    // Attempt to create the second user with duplicate username
    const response = await request.post('/api/users/register').send(user2);

    expect(response.status).toBe(400); 
    expect(response.body).toHaveProperty('message', 'Username already exists');
  });

  test('POST /api/users/register - should not allow duplicate emails', async () => {
    const user1 = {
      username: 'user1',
      email: 'duplicate@example.com',
      password: 'password123',
      phone: '1234567890',
    };

    const user2 = {
      username: 'user2',
      email: 'duplicate@example.com', // Same email
      password: 'password456',
      phone: '0987654321',
    };

    // Create the first user
    await request.post('/api/users/register').send(user1);

    // Attempt to create the second user with duplicate email
    const response = await request.post('/api/users/register').send(user2);

    expect(response.status).toBe(400); 
    expect(response.body).toHaveProperty('message', 'Email already exists');
  });

  test('POST /api/users/login - should login a user and set a cookie', async () => {
    const user = {
      username: 'loginuser',
      email: 'loginuser@example.com',
      password: 'password123',
      phone: '1234567890',
    };

    // Register the user first
    await request.post('/api/users/register').send(user);

    // Attempt to login
    const response = await request.post('/api/users/login').send({
      emailOrUsername: user.email,
      password: user.password,
    });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('username', user.username);
    expect(response.body).toHaveProperty('email', user.email);
    expect(response.body).not.toHaveProperty('password'); // Password should not be returned

    // Check if the cookie is set
    const cookies = response.headers['set-cookie'];
    expect(cookies).toBeDefined();
    expect(cookies.some(cookie => cookie.startsWith('access_token='))).toBe(true);
  });

  test('POST /api/users/login - should not login with invalid credentials', async () => {
    const user = {
      username: 'invaliduser',
      email: 'invaliduser@example.com',
      password: 'password123',
      phone: '1234567890',
    };

    // Register the user first
    await request.post('/api/users/register').send(user);

    // Attempt to login with incorrect password
    const response = await request.post('/api/users/login').send({
      emailOrUsername: user.email,
      password: 'wrongpassword',
    });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('message', 'Invalid email or password');
  });

  test('GET /api/users/logout - should logout a user', async () => {
    const user = {
      username: 'logoutuser',
      email: 'logoutuser@example.com',
      password: 'password123',
      phone: '1234567890',
    };

    // Register the user first
    const registerResponse = await request.post('/api/users/register').send(user);
    const cookies = registerResponse.headers['set-cookie'];

    // Attempt to logout
    const response = await request.get('/api/users/logout').set('Cookie', cookies);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Logged out');

    // Check if the cookie is cleared
    const logoutCookies = response.headers['set-cookie'];
    expect(logoutCookies).toBeDefined();
    expect(logoutCookies.some(cookie => cookie.startsWith('access_token=;'))).toBe(true);
  });

  test('PUT /api/users/updateProfile - should update user profile', async () => {
    const user = {
      username: 'updateuser',
      email: 'updateuser@example.com',
      password: 'password123',
      phone: '1234567890',
    };

    // Register the user first
    const registerResponse = await request.post('/api/users/register').send(user);
    const cookies = registerResponse.headers['set-cookie'];

    // Update profile
    const updatedData = {
      username: 'updateduser',
      email: 'updateduser@example.com',
      phone: '0987654321',
      oldPassword: 'password123',
      newPassword: 'newpassword456',
    };

    const response = await request.put('/api/users/updateProfile').set('Cookie', cookies).send(updatedData);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('username', updatedData.username);
    expect(response.body).toHaveProperty('email', updatedData.email);
    expect(response.body).toHaveProperty('phone', updatedData.phone);
    expect(response.body).not.toHaveProperty('password'); // Password should not be returned

    // Verify that the password was updated by attempting to login with the new password
    const loginResponse = await request.post('/api/users/login').send({
      emailOrUsername: updatedData.email,
      password: updatedData.newPassword,
    });

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body).toHaveProperty('username', updatedData.username);
  });

  test('GET /api/users/bookingHistory - should retrieve booking history for authenticated user', async () => {
    // Assuming you have Booking and related models set up properly
    const user = {
      username: 'bookinguser',
      email: 'bookinguser@example.com',
      password: 'password123',
      phone: '1234567890',
    };

    // Register the user first
    const registerResponse = await request.post('/api/users/register').send(user);
    const cookies = registerResponse.headers['set-cookie'];

    // Create a booking associated with the user
    // You may need to set up additional data like Schedule, Train, Halt, etc.
    // For simplicity, this step is skipped. Ensure your database setup includes necessary references.

    // Retrieve booking history
    const response = await request.get('/api/users/bookingHistory').set('Cookie', cookies);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    // Additional assertions based on expected booking data
  });

  test('POST /api/users/forgotPassword - should send a password reset email', async () => {
    const user = {
      username: 'forgotpassuser',
      email: 'forgotpass@example.com',
      password: 'password123',
      phone: '1234567890',
    };

    // Register the user first
    await request.post('/api/users/register').send(user);

    // Mock the sendForgotPassEmail function if necessary
    // For example, using vitest mocking capabilities

    const response = await request.post('/api/users/forgotPassword').send({ email: user.email });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Email sent');
  });

  test('PUT /api/users/resetPassword - should reset the user password', async () => {
    const user = {
      username: 'resetpassuser',
      email: 'resetpass@example.com',
      password: 'password123',
      phone: '1234567890',
    };

    // Register the user first
    await request.post('/api/users/register').send(user);

    // Initiate forgot password to generate a reset token
    await request.post('/api/users/forgotPassword').send({ email: user.email });

    // Retrieve the user from the database to get the reset token
    const dbUser = await mongoose.model('User').findOne({ email: user.email });
    const resetToken = dbUser.resetToken;

    // Reset the password using the reset token
    const newPassword = 'newpassword456';
    const response = await request.put('/api/users/resetPassword').send({
      resetToken,
      newPassword,
    });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Password reset');

    // Attempt to login with the new password
    const loginResponse = await request.post('/api/users/login').send({
      emailOrUsername: user.email,
      password: newPassword,
    });

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body).toHaveProperty('username', user.username);
  });
});
