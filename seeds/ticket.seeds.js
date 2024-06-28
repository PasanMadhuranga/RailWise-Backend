import Booking from "../models/booking.model.js";
import Schedule from "../models/schedule.model.js";
import Train from "../models/train.model.js";
import Ticket from "../models/ticket.model.js";
import Wagon from "../models/wagon.model.js";


  const NamesandGender = [
    { name: "Kamal", gender: "male"},
    { name: "Nimali", gender: "female"},
    { name: "Sunil", gender: "male"},
    { name: "Ruwan", gender: "male"},
    { name: "Chamara", gender: "male"},
    { name: "Nadeesha", gender: "female"},
    { name: "Dinesh", gender: "male"},
    { name: "Saranga", gender: "female"},
    { name: "Saman", gender: "male"},
    { name: "Madhavi", gender: "female"},
    { name: "Tharindu", gender: "male"},
    { name: "Kusum", gender: "female"},
    { name: "Aruna", gender: "male"},
    { name: "Harsha", gender: "male"},
    { name: "Iresha", gender: "female"},
    { name: "Nuwan", gender: "male"},
    { name: "Amaya", gender: "female"},
    { name: "Lakmal", gender: "male"},
    { name: "Rashmi", gender: "female"},
    { name: "Kasun", gender: "male"},
    { name: "Sithara", gender: "female"},
    { name: "Mahesh", gender: "male"},
    { name: "Vindya", gender: "female"},
    { name: "Ravindu", gender: "male"},
    { name: "Upeksha", gender: "female"},
    { name: "Priyantha", gender: "male"},
    { name: "Shalani", gender: "female"},
    { name: "Sajith", gender: "male"},
    { name: "Hiruni", gender: "female"},
    { name: "Asanka", gender: "male"},
    { name: "Chathurika", gender: "female"},
    { name: "Suranga", gender: "male"},
    { name: "Nilakshi", gender: "female"},
    { name: "Janaka", gender: "male"},
    { name: "Kanchana", gender: "female"},
    { name: "Rukshan", gender: "male"},
    { name: "Ruwanthi", gender: "female"},
    { name: "Suresh", gender: "male"},
    { name: "Menaka", gender: "female"},
    { name: "Gayan", gender: "male"},
    { name: "Thilini", gender: "female"},
  ];
  

// Function to create bookedSeats data
const populateTickets = async () => {
  try {
    // Get the booking data
    const bookings = await Booking.find({});

    // Check if bookedSeats already exist
    const existingTickets = await Ticket.find({});
    if (existingTickets.length > 0) {
      console.log("BookedSeats already populated");
      return;
    }
    let count = 0;
    for (let booking of bookings) {
      const schedule = await Schedule.findById(booking.scheduleRef);
      const train = await Train.findById(schedule.trainRef);
      const wagons = train.wagons;
      const randomWagonId = wagons[Math.floor(Math.random() * wagons.length)];
      const randomWagon = await Wagon.findById(randomWagonId);
      const seatsofWagon = randomWagon.seats;
      for (let i = 0; i < 3; i++) {
        const randomSeatId =
          seatsofWagon[Math.floor(Math.random() * seatsofWagon.length)];
        await Ticket.create({
          bookingRef: booking._id,
          seatRef: randomSeatId,
          ticketPrice: Math.floor(Math.random() * (1000 - 20 + 1)) + 20,
          name: NamesandGender[count].name,
          gender: NamesandGender[count].gender
        });
        count++;
      }
    }

    console.log("Tickets successfully populated");
  } catch (error) {
    console.error("Error populating tickets:", error);
  } 
};

export default populateTickets;
