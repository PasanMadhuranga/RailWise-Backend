import Booking from "../../models/booking.model.js";
import Halt from "../../models/halt.model.js";
import { PDFDocument, rgb } from "pdf-lib";
import fs from "fs";
import nodemailer from "nodemailer";

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

export const generateETickets = async (booking) => {
  const templatePath = "./controllers/helpers/e-ticket-template.pdf";
  const templateBytes = fs.readFileSync(templatePath);
  const pdfBuffers = [];
  console.log("ticket price", booking.ticketPrice);

  for (const seat of booking.seats) {
    const pdfDoc = await PDFDocument.load(templateBytes);
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    const color = rgb(1, 1, 1);
    const { width, height } = firstPage.getSize();
    const fontSize = 12;

    // Adjust the coordinates as per your template layout
    firstPage.drawText(`${booking.date.toISOString().split("T")[0]}`, {
      x: 70,
      y: 25,
      size: fontSize,
      color,
    });

    firstPage.drawText(`${booking.date.toISOString().split("T")[0]}`, {
      x: 394,
      y: 27,
      size: fontSize - 3,
      color,
    });

    firstPage.drawText(`${booking.startHalt.stationRef.name}`, {
      x: 70,
      y: 62,
      size: fontSize,
      color,
    });

    firstPage.drawText(`${booking.startHalt.stationRef.name}`, {
      x: 394,
      y: 65,
      size: fontSize - 3,
      color,
    });

    firstPage.drawText(`${booking.scheduleRef.trainRef.name}`, {
      x: 70,
      y: 98,
      size: fontSize,
      color,
    });
    firstPage.drawText(`${booking.scheduleRef.trainRef.name}`, {
      x: 394,
      y: 101,
      size: fontSize - 3,
      color,
    });

    firstPage.drawText(`${booking._id + seat.wagonRef.wagonNumber + seat.name}`, {
      x: 68,
      y: 137,
      size: fontSize,
      color,
    });
    firstPage.drawText(`${booking._id + seat.wagonRef.wagonNumber + seat.name}`, {
      x: 393,
      y: 138,
      size: fontSize - 3,
      color,
    });
    firstPage.drawText(`${booking.startHalt.departureTime}`, {
      x: 182,
      y: 25,
      size: fontSize,
      color,
    });
    firstPage.drawText(`${booking.startHalt.departureTime}`, {
      x: 469,
      y: 27,
      size: fontSize - 3,
      color,
    });
    firstPage.drawText(`${booking.startHalt.platform}`, {
      x: 184,
      y: 98,
      size: fontSize,
      color,
    });

    firstPage.drawText(`${booking.startHalt.platform}`, {
      x: 467,
      y: 101,
      size: fontSize - 3,
      color,
    });

    firstPage.drawText(`${seat.wagonRef.wagonClassRef.name}`, {
      x: 233,
      y: 138,
      size: fontSize,
      color,
    });

    firstPage.drawText(`${booking.endHalt.arrivalTime}`, {
      x: 261,
      y: 24,
      size: fontSize,
      color,
    });

    firstPage.drawText(`${booking.endHalt.arrivalTime}`, {
      x: 546,
      y: 27,
      size: fontSize - 3,
      color,
    });

    firstPage.drawText(`${booking.endHalt.stationRef.name}`, {
      x: 261,
      y: 62,
      size: fontSize,
      color,
    });

    firstPage.drawText(`${booking.endHalt.stationRef.name}`, {
      x: 514,
      y: 65,
      size: fontSize - 3,
      color,
    });

    firstPage.drawText(`${seat.wagonRef.wagonNumber}`, {
      x: 261,
      y: 98,
      size: fontSize,
      color,
    });

    firstPage.drawText(`${seat.wagonRef.wagonNumber}`, {
      x: 521,
      y: 100,
      size: fontSize - 3,
      color,
    });

    firstPage.drawText(`${seat.name}`, {
      x: 340,
      y: 98,
      size: fontSize,
      color,
    });
    firstPage.drawText(`${seat.name}`, {
      x: 570,
      y: 100,
      size: fontSize - 3,
      color,
    });

    firstPage.drawText(`${booking.ticketPrice} LKR`, {
      x: 295,
      y: 137,
      size: fontSize,
      color,
    });

    firstPage.drawText(`${booking.ticketPrice}` + " LKR", {
      x: 525,
      y: 138,
      size: fontSize - 3,
      color,
    });

    const pdfBytes = await pdfDoc.save();
    pdfBuffers.push(pdfBytes);
  }

  console.log("PDFs generated");

  return pdfBuffers;
};

export const sendConfirmationEmail = async (userEmail, pdfBuffers) => {
  // Create a transporter
  let transporter = nodemailer.createTransport({
    service: "gmail", // or another email service
    auth: {
      user: process.env.EMAIL,
      pass: process.env.APP_PASSWORD,
    },
  });

  // Email content
  let mailOptions = {
    from: process.env.EMAIL,
    to: userEmail,
    subject: "Booking Confirmation",
    text: "Your booking has been confirmed. Please find your e-tickets attached.",
    attachments: pdfBuffers.map((buffer, index) => ({
      filename: `e-ticket-${index + 1}.pdf`,
      content: buffer,
      contentType: "application/pdf",
    })),
  };

  // Send the email
  await transporter.sendMail(mailOptions);
};

export async function releaseExpiredPendingBookings() {
  const now = new Date();
  const bookings = await Booking.find({
    status: "pending",
    pendingTime: { $lt: now },
  });
  for (let booking of bookings) {
    booking.status = "cancelled";
    await booking.save();
  }
}
