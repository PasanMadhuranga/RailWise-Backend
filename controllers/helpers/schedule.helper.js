import Train from "../../models/train.model.js";
import Booking from "../../models/booking.model.js";
import Wagon from "../../models/wagon.model.js";
import WagonClass from "../../models/wagonClass.model.js";
import Halt from "../../models/halt.model.js";
import Seat from "../../models/seat.model.js";

// get the total number of seats of each class of the given train
export const getTotalSeatsofEachClass = async (trainId) => {
  const trainDetails = await Train.findById(trainId).populate({
    path: "wagons",
    select: "wagonClassRef seats",
    populate: {
      path: "wagonClassRef",
      select: "name",
    },
  });
  let firstClass = 0;
  let secondClass = 0;
  let thirdClass = 0;

  for (let wagon of trainDetails.wagons) {
    if (wagon.wagonClassRef.name === "first") {
      firstClass += wagon.seats.length;
    } else if (wagon.wagonClassRef.name === "second") {
      secondClass += wagon.seats.length;
    } else {
      thirdClass += wagon.seats.length;
    }
  }
  return { firstClass, secondClass, thirdClass };
};

// get the number of booked seats of each class of the given schedule on the given date
export const getBookedSeatsofEachClass = async (
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
    })
    .populate({
      path: "seats",
      populate: {
        path: "wagonRef",
        select: "wagonClassRef",
        populate: {
          path: "wagonClassRef",
          select: "name",
        },
      },
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

  const bookedSeatsCount = {
    firstClass: 0,
    secondClass: 0,
    thirdClass: 0,
  };

  // for each booked seat, increment the count of the respective class
  relevantBookedSeats.forEach((seat) => {
    if (seat.wagonRef.wagonClassRef.name === "first") {
      bookedSeatsCount.firstClass++;
    } else if (seat.wagonRef.wagonClassRef.name === "second") {
      bookedSeatsCount.secondClass++;
    } else {
      bookedSeatsCount.thirdClass++;
    }
  });
  return bookedSeatsCount;
};

