import nodemailer from 'nodemailer';
import { 
  sendPlatformReschedule, 
  sendTimeReschedule, 
  generatePeriods, 
  performAggregation, 
  getDayRange, 
  getAffectedHalts, 
  getRelevantBookings, 
  buildUserScheduleData 
} from './admin.helper';
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
        train: 'Express Train'
      },
    ];

    const platform = 3;

    await sendPlatformReschedule(userScheduleData, platform);
    expect(sendMailMock).toHaveBeenCalledTimes(1);

    // Capture the actual arguments passed to sendMailMock
    const mailOptions = sendMailMock.mock.calls[0][0];

    // Assert: Check individual substrings in the text
    expect(mailOptions.from).toBe(process.env.EMAIL);
    expect(mailOptions.to).toBe('jane@example.com');
    expect(mailOptions.subject).toBe('Platform Change Notification');
    expect(mailOptions.text).toContain('Jane Smith');
    expect(mailOptions.text).toContain('Evening Express');
    expect(mailOptions.text).toContain('Express Train');
    expect(mailOptions.text).toContain('3');
    expect(mailOptions.text).toContain('Central Station');
  });

  it('should send emails to multiple users successfully', async () => {
    const userScheduleData = [
      {
        username: 'Jane Smith',
        email: 'jane@example.com',
        schedule: 'Evening Express',
        haltNames: ['Central Station'],
        phone: '0987654321',
        train: 'Express Train'
      },
      {
        username: 'John Doe',
        email: 'john@example.com',
        schedule: 'Morning Express',
        haltNames: ['North Station'],
        phone: '1234567890',
        train: 'Morning Train'
      },
    ];

    const platform = 5;

    await sendPlatformReschedule(userScheduleData, platform);
    expect(sendMailMock).toHaveBeenCalledTimes(2);

    // First email
    const mailOptionsJane = sendMailMock.mock.calls[0][0];
    expect(mailOptionsJane.from).toBe(process.env.EMAIL);
    expect(mailOptionsJane.to).toBe('jane@example.com');
    expect(mailOptionsJane.subject).toBe('Platform Change Notification');
    expect(mailOptionsJane.text).toContain('Jane Smith');
    expect(mailOptionsJane.text).toContain('Evening Express');
    expect(mailOptionsJane.text).toContain('Express Train');
    expect(mailOptionsJane.text).toContain('5');
    expect(mailOptionsJane.text).toContain('Central Station');

    // Second email
    const mailOptionsJohn = sendMailMock.mock.calls[1][0];
    expect(mailOptionsJohn.from).toBe(process.env.EMAIL);
    expect(mailOptionsJohn.to).toBe('john@example.com');
    expect(mailOptionsJohn.subject).toBe('Platform Change Notification');
    expect(mailOptionsJohn.text).toContain('John Doe');
    expect(mailOptionsJohn.text).toContain('Morning Express');
    expect(mailOptionsJohn.text).toContain('Morning Train');
    expect(mailOptionsJohn.text).toContain('5');
    expect(mailOptionsJohn.text).toContain('North Station');
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
        train: 'Express Train'
      },
    ];

    const platform = 3;

    await sendPlatformReschedule(userScheduleData, platform);
    expect(sendMailMock).toHaveBeenCalledTimes(1);
    const mailOptionsJane = sendMailMock.mock.calls[0][0];
    expect(mailOptionsJane.from).toBe(process.env.EMAIL);
    expect(mailOptionsJane.to).toBe('jane@example.com');
    expect(mailOptionsJane.subject).toBe('Platform Change Notification');
    expect(mailOptionsJane.text).toContain('Jane Smith');
    expect(mailOptionsJane.text).toContain('Evening Express');
    expect(mailOptionsJane.text).toContain('Express Train');
    expect(mailOptionsJane.text).toContain('3');
    expect(mailOptionsJane.text).toContain('Central Station');
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
        train: 'Express Train'
      },
    ];

    const time = 15;

    await sendTimeReschedule(userScheduleData, time);
    expect(sendMailMock).toHaveBeenCalledTimes(1);

    // Capture the actual arguments passed to sendMailMock
    const mailOptions = sendMailMock.mock.calls[0][0];

    // Assert: Check individual substrings in the text
    expect(mailOptions.from).toBe(process.env.EMAIL);
    expect(mailOptions.to).toBe('jane@example.com');
    expect(mailOptions.subject).toBe('Time Change Notification');
    expect(mailOptions.text).toContain('Jane Smith');
    expect(mailOptions.text).toContain('Evening Express');
    expect(mailOptions.text).toContain('Express Train');
    expect(mailOptions.text).toContain('15 minutes');
    expect(mailOptions.text).toContain('Central Station');
    expect(mailOptions.text).toContain('North Station');
  });

  it('should send emails to multiple users successfully', async () => {
    const userScheduleData = [
      {
        username: 'Jane Smith',
        email: 'jane@example.com',
        schedule: 'Evening Express',
        haltNames: ['Central Station', 'North Station'],
        phone: '0987654321',
        train: 'Express Train'
      },
      {
        username: 'John Doe',
        email: 'john@example.com',
        schedule: 'Evening Express',
        haltNames: ['West Station'],
        phone: '1234567890',
        train: 'Express Train'
      },
    ];

    const time = 30;

    await sendTimeReschedule(userScheduleData, time);
    expect(sendMailMock).toHaveBeenCalledTimes(2);

    // First email
    const mailOptionsJane = sendMailMock.mock.calls[0][0];
    expect(mailOptionsJane.from).toBe(process.env.EMAIL);
    expect(mailOptionsJane.to).toBe('jane@example.com');
    expect(mailOptionsJane.subject).toBe('Time Change Notification');
    expect(mailOptionsJane.text).toContain('Jane Smith');
    expect(mailOptionsJane.text).toContain('Evening Express');
    expect(mailOptionsJane.text).toContain('Express Train');
    expect(mailOptionsJane.text).toContain('30 minutes');
    expect(mailOptionsJane.text).toContain('Central Station');
    expect(mailOptionsJane.text).toContain('North Station');

    // Second email
    const mailOptionsJohn = sendMailMock.mock.calls[1][0];
    expect(mailOptionsJohn.from).toBe(process.env.EMAIL);
    expect(mailOptionsJohn.to).toBe('john@example.com');
    expect(mailOptionsJohn.subject).toBe('Time Change Notification');
    expect(mailOptionsJohn.text).toContain('John Doe');
    expect(mailOptionsJohn.text).toContain('Evening Express');
    expect(mailOptionsJohn.text).toContain('Express Train');
    expect(mailOptionsJohn.text).toContain('30 minutes');
    expect(mailOptionsJohn.text).toContain('West Station');
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
        train: 'Express Train'
      },
    ];

    const time = 20;

    await sendTimeReschedule(userScheduleData, time);
    expect(sendMailMock).toHaveBeenCalledTimes(1);
    const mailOptionsJane = sendMailMock.mock.calls[0][0];
    expect(mailOptionsJane.from).toBe(process.env.EMAIL);
    expect(mailOptionsJane.to).toBe('jane@example.com');
    expect(mailOptionsJane.subject).toBe('Time Change Notification');
    expect(mailOptionsJane.text).toContain('Jane Smith');
    expect(mailOptionsJane.text).toContain('Evening Express');
    expect(mailOptionsJane.text).toContain('Express Train');
    expect(mailOptionsJane.text).toContain('20 minutes');
    expect(mailOptionsJane.text).toContain('Central Station');
    expect(mailOptionsJane.text).toContain('North Station');
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
