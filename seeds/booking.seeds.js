import Schedule from '../models/schedule.model.js';
import User from '../models/user.model.js';
import Halt from '../models/halt.model.js';
import Train from '../models/train.model.js';
import Booking from '../models/booking.model.js';


const populateBookings = async () => {
  try {
    const users = await User.find({});
    const schedules = await Schedule.find({});

    for (let i = 0; i < 500; i++) {
        const user = users[Math.floor(Math.random() * users.length)];
    
        const schedule = schedules[Math.floor(Math.random() * schedules.length)];
        const train = await Train.findById(schedule.trainRef).populate("wagons")
        const randomWagon = train.wagons[Math.floor(Math.random() * train.wagons.length)];
        const getRandomSeats = (wagon) => {
            const seats = [];
            const randomSeatCount = Math.floor(Math.random() * 5) + 1;
            for (let i = 0; i < randomSeatCount; i++) {
                seats.push(wagon.seats[Math.floor(Math.random() * wagon.seats.length)]);
            }
            return seats;
        };

        const halts = await Halt.find({ scheduleRef: schedule._id });

        const halt1 = halts[Math.floor(Math.random() * halts.length)];

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

        const startDate = new Date("2023-01-01");
        const endDate = new Date("2024-12-31");
        const status = ['approved', 'cancelled'];

        await Booking.create({
            userRef: user._id,
            scheduleRef: schedule._id,
            date: new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime())),
            startHalt: startHalt._id,
            endHalt: endHalt._id,
            totalFare: Math.abs(startHalt.price - endHalt.price),
            status: status[Math.floor(Math.random() * status.length)],
            seats: getRandomSeats(randomWagon),
        });
    }
    console.log('Bookings successfully populated');
    }
   catch (error) {
    console.error('Error populating bookings:', error);
  } 
};

export default populateBookings;