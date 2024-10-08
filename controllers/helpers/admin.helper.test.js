import nodemailer from 'nodemailer';
import { sendPlatformReschedule, sendTimeReschedule, generatePeriods, performAggregation, getDayRange, getAffectedHalts, getRelevantBookings, buildUserScheduleData } from './admin.helper';
import dotenv from 'dotenv';
dotenv.config();

vi.mock('nodemailer');

describe('sendPlatformReschedule', () => {
  let sendMailMock;

  beforeEach(() => {
    vi.resetAllMocks();
    sendMailMock = vi.fn().mockResolvedValue('Mail sent');
    const createTransportMock = {
      sendMail: sendMailMock,
    };
    nodemailer.createTransport.mockReturnValue(createTransportMock);
    
    // Suppress console logs for testing
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should send emails successfully', async () => {
    const userScheduleData = [
      {
        username: 'Jane Smith',
        email: 'jane@example.com',
        schedule: 'Evening Express',
        haltNames: ['Central Station'],
        phone: '0987654321',
      },
    ];

    const platform = 3;

    await sendPlatformReschedule(userScheduleData, platform);
    expect(sendMailMock).toHaveBeenCalledTimes(1);

    // Assert: Check if sendMail was called with the correct parameters
    expect(sendMailMock).toHaveBeenCalledWith({
      from: process.env.EMAIL,
      to: 'jane@example.com',
      subject: 'Platform Change Notification',
      text: `Dear Jane Smith,\n\nFor schedule \"Evening Express\", the platform has been changed to 3 on Central Station.\n\nRegards,\nRailWise Team`,
    });
  });

  it('should send emails to multiple users successfully', async () => {
    const userScheduleData = [
      {
        username: 'Jane Smith',
        email: 'jane@example.com',
        schedule: 'Evening Express',
        haltNames: ['Central Station'],
        phone: '0987654321',
      },
      {
        username: 'John Doe',
        email: 'john@example.com',
        schedule: 'Morning Express',
        haltNames: ['North Station'],
        phone: '1234567890',
      },
    ];

    const platform = 5;

    await sendPlatformReschedule(userScheduleData, platform);
    expect(sendMailMock).toHaveBeenCalledTimes(2);

    // Assert: Check if sendMail was called with the correct parameters for both users
    expect(sendMailMock).toHaveBeenCalledWith({
      from: process.env.EMAIL,
      to: 'jane@example.com',
      subject: 'Platform Change Notification',
      text: `Dear Jane Smith,\n\nFor schedule \"Evening Express\", the platform has been changed to 5 on Central Station.\n\nRegards,\nRailWise Team`,
    });
    expect(sendMailMock).toHaveBeenCalledWith({
      from: process.env.EMAIL,
      to: 'john@example.com',
      subject: 'Platform Change Notification',
      text: `Dear John Doe,\n\nFor schedule \"Morning Express\", the platform has been changed to 5 on North Station.\n\nRegards,\nRailWise Team`,
    });
  });

  it('should handle email sending failure gracefully', async () => {
    sendMailMock.mockRejectedValueOnce(new Error('Failed to send email'));

    const userScheduleData = [
      {
        username: 'Jane Smith',
        email: 'jane@example.com',
        schedule: 'Evening Express',
        haltNames: ['Central Station'],
        phone: '0987654321',
      },
    ];

    const platform = 3;

    await sendPlatformReschedule(userScheduleData, platform);
    expect(sendMailMock).toHaveBeenCalledTimes(1);
    expect(sendMailMock).toHaveBeenCalledWith({
      from: process.env.EMAIL,
      to: 'jane@example.com',
      subject: 'Platform Change Notification',
      text: `Dear Jane Smith,\n\nFor schedule \"Evening Express\", the platform has been changed to 3 on Central Station.\n\nRegards,\nRailWise Team`,
    });
  });

  it('should not send any emails if userScheduleData is empty', async () => {
    const userScheduleData = [];
    const platform = 3;

    await sendPlatformReschedule(userScheduleData, platform);
    expect(sendMailMock).not.toHaveBeenCalled();
  });
});

describe('sendTimeReschedule', () => {
  let sendMailMock;

  beforeEach(() => {
    vi.resetAllMocks();
    sendMailMock = vi.fn().mockResolvedValue('Mail sent');
    const createTransportMock = {
      sendMail: sendMailMock,
    };
    nodemailer.createTransport.mockReturnValue(createTransportMock);
    
    // Suppress console logs for testing
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should send time reschedule emails successfully', async () => {
    const userScheduleData = [
      {
        username: 'Jane Smith',
        email: 'jane@example.com',
        schedule: 'Evening Express',
        haltNames: ['Central Station', 'North Station'],
        phone: '0987654321',
      },
    ];

    const time = 15;

    await sendTimeReschedule(userScheduleData, time);
    expect(sendMailMock).toHaveBeenCalledTimes(1);

    // Assert: Check if sendMail was called with the correct parameters
    expect(sendMailMock).toHaveBeenCalledWith({
      from: process.env.EMAIL,
      to: 'jane@example.com',
      subject: 'Time Change Notification',
      text: `Dear Jane Smith,\n\nFor schedule \"Evening Express\", the time has been delayed by 15 minutes at Central Station and North Station.\n\nRegards,\nRailWise Team`,
    });
  });

  it('should send emails to multiple users successfully', async () => {
    const userScheduleData = [
      {
        username: 'Jane Smith',
        email: 'jane@example.com',
        schedule: 'Evening Express',
        haltNames: ['Central Station', 'North Station'],
        phone: '0987654321',
      },
      {
        username: 'John Doe',
        email: 'john@example.com',
        schedule: 'Morning Express',
        haltNames: ['West Station'],
        phone: '1234567890',
      },
    ];

    const time = 30;

    await sendTimeReschedule(userScheduleData, time);
    expect(sendMailMock).toHaveBeenCalledTimes(2);

    // Assert: Check if sendMail was called with the correct parameters for both users
    expect(sendMailMock).toHaveBeenCalledWith({
      from: process.env.EMAIL,
      to: 'jane@example.com',
      subject: 'Time Change Notification',
      text: `Dear Jane Smith,\n\nFor schedule \"Evening Express\", the time has been delayed by 30 minutes at Central Station and North Station.\n\nRegards,\nRailWise Team`,
    });
    expect(sendMailMock).toHaveBeenCalledWith({
      from: process.env.EMAIL,
      to: 'john@example.com',
      subject: 'Time Change Notification',
      text: `Dear John Doe,\n\nFor schedule \"Morning Express\", the time has been delayed by 30 minutes at West Station.\n\nRegards,\nRailWise Team`,
    });
  });

  it('should handle email sending failure gracefully', async () => {
    sendMailMock.mockRejectedValueOnce(new Error('Failed to send email'));

    const userScheduleData = [
      {
        username: 'Jane Smith',
        email: 'jane@example.com',
        schedule: 'Evening Express',
        haltNames: ['Central Station', 'North Station'],
        phone: '0987654321',
      },
    ];

    const time = 20;

    await sendTimeReschedule(userScheduleData, time);
    expect(sendMailMock).toHaveBeenCalledTimes(1);
    expect(sendMailMock).toHaveBeenCalledWith({
      from: process.env.EMAIL,
      to: 'jane@example.com',
      subject: 'Time Change Notification',
      text: `Dear Jane Smith,\n\nFor schedule \"Evening Express\", the time has been delayed by 20 minutes at Central Station and North Station.\n\nRegards,\nRailWise Team`,
    });
  });

  it('should not send any emails if userScheduleData is empty', async () => {
    const userScheduleData = [];
    const time = 10;

    await sendTimeReschedule(userScheduleData, time);
    expect(sendMailMock).not.toHaveBeenCalled();
  });
});

describe('generatePeriods', () => {
  it('should generate yearly periods correctly', () => {
    const { periods } = generatePeriods('yearly');
    const currentYear = new Date().getFullYear();
    const expectedPeriods = Array.from({ length: 6 }, (_, i) => ({ year: currentYear - 5 + i }));
    expect(periods).toEqual(expectedPeriods);
  });

  it('should throw an error for invalid time frame', () => {
    expect(() => generatePeriods('invalid')).toThrow('Invalid time frame');
  });
});

describe('performAggregation', () => {
  it('should perform aggregation and return results correctly', async () => {
    const mockModel = {
      aggregate: vi.fn().mockResolvedValue([{
        _id: { year: 2023, month: 5 },
        value: 10,
      }]),
    };
    const matchStage = {};
    const groupBy = { year: { $year: '$date' }, month: { $month: '$date' } };
    const periods = [{ year: 2023, month: 5 }];
    const result = await performAggregation(mockModel, matchStage, groupBy, periods, 'monthly', { value: { $sum: 1 } }, 'total');
    expect(result).toEqual([{ period: '23/May', total: 10 }]);
  });
});

describe('getDayRange', () => {
  it('should return the correct day range for a given date', () => {
    const date = new Date('2023-10-08T00:00:00Z');
    const { startOfDay, endOfDay } = getDayRange(date);
    expect(startOfDay.toISOString()).toBe('2023-10-08T00:00:00.000Z');
    expect(endOfDay.toISOString()).toBe('2023-10-08T23:59:59.999Z');
  });
});