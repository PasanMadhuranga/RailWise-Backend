import Booking from '../models/booking.model.js';
import Ticket from '../models/ticket.model.js';


const addSeatsToBooking = async () => {
    try {
        const tickets = await Ticket.find({});
        for (let seat of tickets) {
            const booking = await Booking.findById(seat.bookingRef);
            booking.seats.push(seat.seatRef);
            await booking.save();
        }
        console.log('BookedSeats added to booking successfully');
    } catch (error) {
        console.error('Error adding bookedSeats to booking:', error);
    } 
}

export default addSeatsToBooking;
