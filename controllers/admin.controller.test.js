import { changePlatform, timeChange } from './admin.controller';
import mongoose from 'mongoose';
import Booking from '../models/booking.model.js';
import Halt from '../models/halt.model.js';
import Schedule from '../models/schedule.model.js';
import Station from '../models/station.model.js';
import User from '../models/user.model.js';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

// Integration Test for changePlatform
describe('changePlatform - Integration Test', () => {
  let req, res, next;
  let sendMailMock;

  beforeAll(async () => {
    // Connect to the in-memory database or test database
    await mongoose.connect('mongodb://localhost:27017/testdb');
  });

  afterAll(async () => {
    // Disconnect from the test database
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    req = {
      body: {
        haltId: '507f1f77bcf86cd799439011',
        haltName: 'Central Station',
        platform: 3,
        date: '2023-10-08',
      },
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    next = vi.fn();

    // Clear test data before each test
    await Booking.deleteMany({});
    await Halt.deleteMany({});
    await Schedule.deleteMany({});
    await Station.deleteMany({});
    await User.deleteMany({});

    // Insert test data
    const user1 = await User.create({ _id: '507f1f77bcf86cd799439033', email: 'jane@example.com', phone: '0987654321', username: 'Jane Smith', password: 'password123' });
    const user2 = await User.create({ _id: '507f1f77bcf86cd799439034', email: 'john@example.com', phone: '1234567890', username: 'John Doe', password: 'password123' });
    const station = await Station.create({ _id: '507f1f77bcf86cd799439044', name: 'Central Station' });
    const schedule = await Schedule.create({ _id: '507f1f77bcf86cd799439055', name: 'Evening Express', trainRef: '507f1f77bcf86cd799439066', scheduleType: 'express' });
    const halt = await Halt.create({
      _id: '507f1f77bcf86cd799439011',
      scheduleRef: schedule._id,
      stationRef: station._id,
      arrivalTime: '10:00 AM',
      departureTime: '10:15 AM',
      haltOrder: 1,
      platform: 2,
      price: 10,
    });
    const halt2 = await Halt.create({
      _id: '507f1f77bcf86cd799439012',
      scheduleRef: schedule._id,
      stationRef: station._id,
      arrivalTime: '11:00 AM',
      departureTime: '11:15 AM',
      haltOrder: 2,
      platform: 3,
      price: 15,
    });
    const halt3 = await Halt.create({
      _id: '507f1f77bcf86cd799439013',
      scheduleRef: schedule._id,
      stationRef: station._id,
      arrivalTime: '12:00 PM',
      departureTime: '12:15 PM',
      haltOrder: 3,
      platform: 4,
      price: 20,
    });
    await Booking.create({
      _id: '507f1f77bcf86cd799439022',
      startHalt: halt._id,
      endHalt: halt2._id,
      userRef: user1._id,
      scheduleRef: schedule._id,
      date: new Date('2023-10-08T00:00:00Z'),
      totalFare: 20,
      status: 'approved',
    });
    await Booking.create({
      _id: '507f1f77bcf86cd799439023',
      startHalt: halt2._id,
      endHalt: halt3._id,
      userRef: user2._id,
      scheduleRef: schedule._id,
      date: new Date('2023-10-08T00:00:00Z'),
      totalFare: 25,
      status: 'approved',
    });

    sendMailMock = vi.fn().mockResolvedValue('Mail sent');
    vi.spyOn(nodemailer, 'createTransport').mockReturnValue({
      sendMail: sendMailMock,
    });
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should notify only relevant passengers successfully', async () => {
    await changePlatform(req, res, next);

    // Expect only the user whose startHalt or endHalt matches the haltId to be notified
    expect(sendMailMock).toHaveBeenCalledTimes(1);
    expect(sendMailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'jane@example.com',
      })
    );
    expect(sendMailMock).not.toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'john@example.com',
      })
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: 'Passengers have been notified successfully.' });
  });

  it('should handle errors gracefully', async () => {
    req.body.haltId = 'invalid_id'; // Set an invalid halt ID to cause an error

    await changePlatform(req, res, next);

    expect(console.error).toHaveBeenCalledWith('Error changing platform:', expect.any(Error));
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Failed to notify passengers.' });
  });
});

// Integration Test for timeChange
// Integration Test for timeChange
describe('timeChange - Integration Test', () => {
    let req, res, next;
    let sendMailMock;
  
    beforeAll(async () => {
      // Connect to the in-memory database or test database
      await mongoose.connect('mongodb://localhost:27017/testdb');
    });
  
    afterAll(async () => {
      // Disconnect from the test database
      await mongoose.connection.close();
    });
  
    beforeEach(async () => {
      req = {
        body: {
          scheduleId: '507f1f77bcf86cd799439055',
          haltOrder: 3,
          haltId: '507f1f77bcf86cd799439013',
          date: '2023-10-08',
          time: 30,
          notifyAll: true,
        },
      };
      res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      next = vi.fn();
  
      // Clear test data before each test
      await Booking.deleteMany({});
      await Halt.deleteMany({});
      await Schedule.deleteMany({});
      await Station.deleteMany({});
      await User.deleteMany({});
  
      // Insert test data
      const user1 = await User.create({ _id: '507f1f77bcf86cd799439033', email: 'jane@example.com', phone: '0987654321', username: 'Jane Smith', password: 'password123' });
      const user2 = await User.create({ _id: '507f1f77bcf86cd799439034', email: 'john@example.com', phone: '1234567890', username: 'John Doe', password: 'password123' });
      const user3 = await User.create({ _id: '507f1f77bcf86cd799439035', email: 'alice@example.com', phone: '0987654322', username: 'Alice Doe', password: 'password123' });
      const user4 = await User.create({ _id: '507f1f77bcf86cd799439036', email: 'bob@example.com', phone: '1234567891', username: 'Bob Smith', password: 'password123' });
  
      const station = await Station.create({ _id: '507f1f77bcf86cd799439044', name: 'Central Station' });
      const schedule1 = await Schedule.create({ _id: '507f1f77bcf86cd799439055', name: 'Evening Express', trainRef: '507f1f77bcf86cd799439066', scheduleType: 'express' });
      const schedule2 = await Schedule.create({ _id: '507f1f77bcf86cd799439056', name: 'Morning Express', trainRef: '507f1f77bcf86cd799439067', scheduleType: 'slow' });
  
      const halt1 = await Halt.create({
        _id: '507f1f77bcf86cd799439011',
        scheduleRef: schedule1._id,
        stationRef: station._id,
        arrivalTime: '10:00 AM',
        departureTime: '10:15 AM',
        haltOrder: 1,
        platform: 2,
        price: 10,
      });
      const halt2 = await Halt.create({
        _id: '507f1f77bcf86cd799439012',
        scheduleRef: schedule1._id,
        stationRef: station._id,
        arrivalTime: '11:00 AM',
        departureTime: '11:15 AM',
        haltOrder: 2,
        platform: 3,
        price: 15,
      });
      const halt3 = await Halt.create({
        _id: '507f1f77bcf86cd799439013',
        scheduleRef: schedule1._id,
        stationRef: station._id,
        arrivalTime: '12:00 PM',
        departureTime: '12:15 PM',
        haltOrder: 3,
        platform: 4,
        price: 20,
      });
      const halt4 = await Halt.create({
        _id: '507f1f77bcf86cd799439014',
        scheduleRef: schedule1._id,
        stationRef: station._id,
        arrivalTime: '01:00 PM',
        departureTime: '01:15 PM',
        haltOrder: 4,
        platform: 5,
        price: 25,
      });
  
      const halt5 = await Halt.create({
        _id: '507f1f77bcf86cd799439015',
        scheduleRef: schedule2._id,
        stationRef: station._id,
        arrivalTime: '09:00 AM',
        departureTime: '09:15 AM',
        haltOrder: 1,
        platform: 2,
        price: 10,
      });
      const halt6 = await Halt.create({
        _id: '507f1f77bcf86cd799439016',
        scheduleRef: schedule2._id,
        stationRef: station._id,
        arrivalTime: '10:00 AM',
        departureTime: '10:15 AM',
        haltOrder: 2,
        platform: 3,
        price: 15,
      });
      const halt7 = await Halt.create({
        _id: '507f1f77bcf86cd799439017',
        scheduleRef: schedule2._id,
        stationRef: station._id,
        arrivalTime: '11:00 AM',
        departureTime: '11:15 AM',
        haltOrder: 3,
        platform: 4,
        price: 20,
      });
      const halt8 = await Halt.create({
        _id: '507f1f77bcf86cd799439018',
        scheduleRef: schedule2._id,
        stationRef: station._id,
        arrivalTime: '12:00 PM',
        departureTime: '12:15 PM',
        haltOrder: 4,
        platform: 5,
        price: 25,
      });
  
      // Create bookings
      await Booking.create({
        startHalt: halt1._id,
        endHalt: halt2._id,
        userRef: user1._id,
        scheduleRef: schedule1._id,
        date: new Date('2023-10-08T00:00:00Z'),
        totalFare: 20,
        status: 'approved',
      });
      await Booking.create({
        startHalt: halt2._id,
        endHalt: halt3._id,
        userRef: user2._id,
        scheduleRef: schedule1._id,
        date: new Date('2023-10-08T00:00:00Z'),
        totalFare: 25,
        status: 'approved',
      });
      await Booking.create({
        startHalt: halt3._id,
        endHalt: halt4._id,
        userRef: user3._id,
        scheduleRef: schedule1._id,
        date: new Date('2023-10-08T00:00:00Z'),
        totalFare: 30,
        status: 'approved',
      });
      await Booking.create({
        startHalt: halt1._id,
        endHalt: halt4._id,
        userRef: user4._id,
        scheduleRef: schedule1._id,
        date: new Date('2023-10-08T00:00:00Z'),
        totalFare: 40,
        status: 'approved',
      });
  
      await Booking.create({
        startHalt: halt5._id,
        endHalt: halt6._id,
        userRef: user1._id,
        scheduleRef: schedule2._id,
        date: new Date('2023-10-08T00:00:00Z'),
        totalFare: 20,
        status: 'approved',
      });
      await Booking.create({
        startHalt: halt6._id,
        endHalt: halt7._id,
        userRef: user2._id,
        scheduleRef: schedule2._id,
        date: new Date('2023-10-08T00:00:00Z'),
        totalFare: 25,
        status: 'approved',
      });
      await Booking.create({
        startHalt: halt7._id,
        endHalt: halt8._id,
        userRef: user3._id,
        scheduleRef: schedule2._id,
        date: new Date('2023-10-08T00:00:00Z'),
        totalFare: 30,
        status: 'approved',
      });
      await Booking.create({
        startHalt: halt5._id,
        endHalt: halt8._id,
        userRef: user4._id,
        scheduleRef: schedule2._id,
        date: new Date('2023-10-08T00:00:00Z'),
        totalFare: 40,
        status: 'approved',
      });
  
      vi.spyOn(console, 'error').mockImplementation(() => {});
      sendMailMock = vi.fn().mockResolvedValue('Mail sent');
      vi.spyOn(nodemailer, 'createTransport').mockReturnValue({
        sendMail: sendMailMock,
      });
    });
  
    it('should notify all relevant passengers successfully', async () => {
      await timeChange(req, res, next);
  
      // Expect users whose startHalt or endHalt has haltOrder 3 or 4 to be notified
      expect(sendMailMock).toHaveBeenCalledTimes(3);
      expect(sendMailMock).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'john@example.com', // User 2
        })
      );
      expect(sendMailMock).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'alice@example.com', // User 3
        })
      );
      expect(sendMailMock).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'bob@example.com', // User 4
        })
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'Passengers have been notified successfully.' });
    });
  
    it('should handle errors gracefully', async () => {
      req.body.scheduleId = 'invalid_id'; 
  
      await timeChange(req, res, next);
  
      expect(console.error).toHaveBeenCalledWith('Error changing time:', expect.any(Error));
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to notify passengers.' });
    });
  
    it('should notify only specific halt if notifyAll is false', async () => {
      req.body.notifyAll = false;
  
      await timeChange(req, res, next);
  
      // Expect only users with startHalt or endHalt matching haltId (halt3) to be notified
      expect(sendMailMock).toHaveBeenCalledTimes(2);
      expect(sendMailMock).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'alice@example.com',
        })
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'Passengers have been notified successfully.' });
    });
});
  