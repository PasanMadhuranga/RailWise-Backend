// __tests__/generateETickets.test.js
import { generateETickets } from '../controllers/helpers/booking.helper.js'; // Ensure the correct path and extension
import fs from 'fs';
import axios from 'axios';
import crypto from 'crypto';
import mongoose from 'mongoose';

const { ObjectId } = mongoose.Types;

// Mock the dependencies
jest.mock('fs', () => ({
  writeFileSync: jest.fn(),
  readFileSync: jest.fn(() => Buffer.from('mocked pdf template')),
}));

jest.mock('axios');
jest.mock('crypto', () => ({
  createHash: jest.fn(() => ({
    update: jest.fn().mockReturnThis(),
    digest: jest.fn(() => 'mockedhash'),
  })),
}));

describe('generateETickets', () => {
  const bookingMock = {
    _id: new ObjectId('66f79db6858d43cb69638a1b'),
    date: new Date('2024-09-30T00:00:00.000Z'),
    startHalt: {
      stationRef: { name: 'Beliaththa' },
      departureTime: '05:25 am',
      platform: 3,
    },
    endHalt: {
      stationRef: { name: 'Maradana' },
      arrivalTime: '09:47 am',
    },
    scheduleRef: {
      trainRef: { name: 'Galu Kumari' },
    },
    ticketPrice: 930,
    seats: [
      {
        name: '7D',
        wagonRef: {
          wagonNumber: 'W1',
          wagonClassRef: { name: 'First Class' },
        },
        _id: new ObjectId('66f78fc8e0e3945720c142ed'), // Ensure _id is present
      },
    ],
  };

  beforeEach(() => {
    axios.get.mockResolvedValue({
      data: Buffer.from('fake qr code'),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should generate e-ticket and save it as PDF', async () => {
    const pdfBuffers = await generateETickets(bookingMock);

    // Check if the PDF buffer is generated correctly
    expect(pdfBuffers.length).toBe(1);

    // Check that the QR code API was called with the correct hash
    expect(axios.get).toHaveBeenCalledWith(
      expect.stringContaining('mockedhash')
    );

    // Validate that fs.readFileSync is called to load the template
    expect(fs.readFileSync).toHaveBeenCalledWith(
      './controllers/helpers/e-ticket-template.pdf'
    );

    // Ensure the PDF was created
    expect(pdfBuffers[0]).toBeInstanceOf(Uint8Array);
    expect(pdfBuffers[0].length).toBeGreaterThan(0);
  });

  test('should include QR code in the generated ticket', async () => {
    await generateETickets(bookingMock);
    expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('mockedhash'));
  });
});
