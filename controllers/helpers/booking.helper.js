import Booking from "../../models/booking.model.js";
import Halt from "../../models/halt.model.js";
import { PDFDocument, rgb } from "pdf-lib";
import fs from "fs";
import nodemailer from "nodemailer";
import crypto from "crypto";
import axios from "axios";

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
    status: { $ne: "cancelled" }, // exclude the cancelled bookings.
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
          toHalt.haltOrder <= booking.startHalt.haltOrder) ||
        (fromHalt.haltOrder >= booking.endHalt.haltOrder &&
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
  const templateBytes = fs.readFileSync("./controllers/helpers/e-ticket-template.pdf");
  const pdfBuffers = [];

  for (const seat of booking.seats) {
    const pdfDoc = await PDFDocument.load(templateBytes);
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    const color = rgb(1, 1, 1);
    const { width, height } = firstPage.getSize();
    const fontSize = 12;

    const payload = {
      bookingId: booking._id.toString(),
      seatId: seat._id.toString(),
    };

    const SECRET_KEY = process.env.QR_SECRET_KEY || "your-secret-key";
    const signature = crypto
      .createHmac("sha256", SECRET_KEY)
      .update(JSON.stringify(payload))
      .digest("hex");

    const qrData = JSON.stringify({ ...payload, signature });

    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=750x750&data=${
      process.env.BACKEND_URL
    }/api/bookings/validateTicket/${encodeURIComponent(
      payload.bookingId
    )}/${encodeURIComponent(payload.seatId)}/${encodeURIComponent(signature)}`;

    const qrCodeImage = await axios
      .get(qrUrl, { responseType: "arraybuffer" })
      .then((response) => response.data);

    const qrImage = await pdfDoc.embedPng(qrCodeImage);
    const qrImageDims = qrImage.scale(0.175);

    firstPage.drawImage(qrImage, {
      x: 461,
      y: 30,
      width: qrImageDims.width,
      height: qrImageDims.height,
    });

    firstPage.drawText(`${booking.date.toISOString().split("T")[0]}`, {
      x: 70,
      y: 25,
      size: fontSize,
      color,
    });

    firstPage.drawText(`${booking.startHalt.stationRef.name}`, {
      x: 70,
      y: 62,
      size: fontSize,
      color,
    });

    firstPage.drawText(`${booking.scheduleRef.trainRef.name}`, {
      x: 70,
      y: 98,
      size: fontSize,
      color,
    });

    firstPage.drawText(
      `${booking._id + seat.wagonRef.wagonNumber + seat.name}`,
      {
        x: 68,
        y: 137,
        size: fontSize,
        color,
      }
    );

    firstPage.drawText(`${booking.startHalt.departureTime}`, {
      x: 215,
      y: 25,
      size: fontSize,
      color,
    });

    firstPage.drawText(`${booking.startHalt.platform}`, {
      x: 285,
      y: 98,
      size: fontSize,
      color,
    });

    firstPage.drawText(`${seat.wagonRef.wagonClassRef.name}`, {
      x: 215,
      y: 98,
      size: fontSize,
      color,
    });

    firstPage.drawText(`${booking.endHalt.arrivalTime}`, {
      x: 330,
      y: 24,
      size: fontSize,
      color,
    });

    firstPage.drawText(`${booking.endHalt.stationRef.name}`, {
      x: 281,
      y: 62,
      size: fontSize,
      color,
    });

    firstPage.drawText(`${seat.wagonRef.wagonNumber}`, {
      x: 350,
      y: 98,
      size: fontSize,
      color,
    });

    firstPage.drawText(`${seat.name}`, {
      x: 410,
      y: 98,
      size: fontSize,
      color,
    });

    firstPage.drawText(`${booking.ticketPrice} LKR`, {
      x: 350,
      y: 137,
      size: fontSize,
      color,
    });

    const pdfBytes = await pdfDoc.save();
    pdfBuffers.push(pdfBytes);
  }

  return pdfBuffers;
};

export const sendConfirmationEmail = async (userEmail, pdfBuffers) => {
  let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL,
      pass: process.env.APP_PASSWORD,
    },
  });

  // read the email template from the file
  let htmlContent = fs.readFileSync(
    "./controllers/helpers/email_templates/bookingConfirmationEmail.html",
    "utf8"
  );

  let mailOptions = {
    from: process.env.EMAIL,
    to: userEmail,
    subject: "Booking Confirmation",
    html: htmlContent,
    attachments: pdfBuffers.map((buffer, index) => ({
      filename: `e-ticket-${index + 1}.pdf`,
      content: buffer,
      contentType: "application/pdf",
    })),
  };

  await transporter.sendMail(mailOptions);
};

export const sendCancellationEmail = async (
  userEmail,
  userName,
  startHalt,
  endHalt,
  trainName,
  date
) => {
  let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL,
      pass: process.env.APP_PASSWORD,
    },
  });

  let htmlContent = fs.readFileSync(
    "./controllers/helpers/email_templates/bookingCancellationEmail.html",
    "utf-8"
  );

  // replace placeholders in the email template with actual values
  htmlContent = htmlContent
    .replace("{{userName}}", userName)
    .replace("{{trainName}}", trainName)
    .replace("{{date}}", date.toISOString().split("T")[0])
    .replace("{{startHalt}}", startHalt)
    .replace("{{endHalt}}", endHalt);

  let mailOptions = {
    from: process.env.EMAIL,
    to: userEmail,
    subject: "Booking Cancelled",
    html: htmlContent,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.log("Error sending email:", error);
  }
};

export async function releaseExpiredPendingBookings() {
  const now = new Date();
  const bookings = await Booking.find({
    status: "pending",
    pendingTime: { $lt: now },
  });
  for (let booking of bookings) {
    booking.status = "expired";
    await booking.save();
  }
}
