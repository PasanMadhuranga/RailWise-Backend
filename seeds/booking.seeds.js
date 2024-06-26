import mongoose from 'mongoose';
import Schedule from '../models/schedule.model.js';
import User from '../models/user.model.js';
import Halt from '../models/halt.model.js';
import Booking from '../models/booking.model.js';

const dbUrl = "mongodb://127.0.0.1:27017/train-booking-test";

// Connect to MongoDB
mongoose.connect(dbUrl)
.then(() => {
    console.log('Connected to MongoDB');
})
.catch(err => {
    console.error('Error connecting to MongoDB', err);
});

// Function to create booking data
const createBookings = async () => {
  try {
    // Get the user data
    const users = await User.find({});
    const schedules = await Schedule.find({});

    for (let i = 0; i < 10; i++) {
        // Randomly select a user
        const user = users[Math.floor(Math.random() * users.length)];
    
        // Randomly select a schedule
        const schedule = schedules[Math.floor(Math.random() * schedules.length)];
    
        // Get all stops for the schedule
        const halts = await Halt.find({ scheduleRef: schedule._id });

        // Randomly select a start stop
        const halt1 = halts[Math.floor(Math.random() * halts.length)];

        // Randomly select an end stop
        const halt2 = halts[Math.floor(Math.random() * halts.length)];

        let startHalt;
        let endHalt;

        if (halt1.haltOrder < halt2.haltOrder) {
            startHalt = halt1;
            endHalt = halt2;
        } else {
            startHalt = halt2;
            endHalt = halt1;
        }

        // Create booking instances
        await Booking.create({
            userRef: user._id,
            scheduleRef: schedule._id,
            date: new Date(),
            startHalt: startHalt._id,
            endHalt: endHalt._id,
            totalFare: Math.abs(startHalt.price - endHalt.price),
            status: 'approved',
        });
    }
    console.log('Bookings successfully populated');
    }
   catch (error) {
    console.error('Error populating bookings:', error);
  } finally {
    mongoose.connection.close();
  }
};

createBookings();