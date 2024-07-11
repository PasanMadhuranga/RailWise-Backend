import Booking from "../../models/booking.model.js";
import Halt from "../../models/halt.model.js";

export const getBookedSeatsofSchedule = async (
    scheduleId,
    date,
    fromHalt,
    toHalt
  ) => {
    // get all the bookings of that schedule on that date
    const AllbookingsOnDate = await Booking.find({
      scheduleRef: scheduleId,
      date: {
        $gte: new Date(date),
        $lt: new Date(date).setDate(new Date(date).getDate() + 1),
      },
      status: { $ne: "cancelled" }, // exclude the cancelled bookings. that means only confirmed and hold bookings are considered
    })
      .populate({
        path: "startHalt",
        select: "haltOrder",
      })
      .populate({
        path: "endHalt",
        select: "haltOrder",
      });
  
    // filter out the bookings that have a to stop number greater than the from stop number.
    // that is, the bookings that are relevant to the journey from the from stop to the to stop
    let relevantBookingsOnDate = [];
    AllbookingsOnDate.forEach((booking) => {
      if (
        !(
          (fromHalt.haltOrder < booking.startHalt.haltOrder &&
            toHalt.haltOrder < booking.startHalt.haltOrder) ||
          (fromHalt.haltOrder > booking.endHalt.haltOrder &&
            toHalt.haltOrder > booking.endHalt.haltOrder)
        )
      ) {
        relevantBookingsOnDate.push(booking);
      }
    });
  
    // from all the relevant bookings, get all the booked seats
    const relevantBookedSeats = relevantBookingsOnDate
      .map((booking) => booking.seats)
      .flat();
  
    return relevantBookedSeats;
  };
  