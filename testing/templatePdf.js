import { PDFDocument, rgb } from "pdf-lib";
import fs from "fs";
import axios from "axios";

const generateETickets = async (booking) => {
  const templatePath = "./Ticket_template.pdf";
  const templateBytes = fs.readFileSync(templatePath);
  const pdfBuffers = [];
  console.log("ticket price", booking.ticketPrice);

  for (const seat of booking.seats) {
    const pdfDoc = await PDFDocument.load(templateBytes);
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    const color = rgb(1, 1, 1);
    const { width, height } = firstPage.getSize();
    console.log("height", height);
    console.log("width", width);
    const fontSize = 12;

    // Adjust the coordinates as per your template layout
    firstPage.drawText(`${booking.date.split("T")[0]}`, {
      x: 70,
      y: 25,
      size: fontSize,
      color,
    });

    firstPage.drawText(`${booking.from.name}`, {
      x: 70,
      y: 62,
      size: fontSize,
      color,
    });

    firstPage.drawText(`${booking.train}`, {
        x: 70,
        y: 98,
        size: fontSize,
        color,
      });

    firstPage.drawText(`${booking._id}`, {
        x: 68,
        y: 137,
        size: fontSize,
        color,
      });

    firstPage.drawText(`${booking.from.departureTime}`, {
      x: 182,
      y: 25,
      size: fontSize,
      color,
    });

    firstPage.drawText(`${booking.from.platformNumber}`, {
      x: 184,
      y: 98,
      size: fontSize,
      color,
    });

    firstPage.drawText(`${booking.class}`, {
      x: 233,
      y: 138,
      size: fontSize,
      color,
    });

    firstPage.drawText(`${booking.to.arrivalTime}`, {
      x: 261,
      y: 24,
      size: fontSize,
      color,
    }); 

    firstPage.drawText(`${booking.to.name}`, {
      x: 261,
      y: 62,
      size: fontSize,
      color,
    }); 

    firstPage.drawText(`${seat.wagonNumber}`, {
      x: 261,
      y: 98,
      size: fontSize,
      color,
    });
    
    firstPage.drawText(`${seat.name}`, {
      x: 340,
      y: 98,
      size: fontSize,
      color,
    });

    firstPage.drawText(`${seat.amount}` + 'LKR', {
      x: 295,
      y: 137,
      size: fontSize,
      color,
    });

    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=750x750&data=http://${process.env.HOST}:3000/api/bookings/validateTicket/djsrf3rd2q3d2qe/12d3qdd3qdq/1212s12qdqd`;
    
    const qrCodeImage = await axios.get(qrUrl, { responseType: 'arraybuffer' }).then(response => response.data);
    
    const qrImage = await pdfDoc.embedPng(qrCodeImage);
    const qrImageDims = qrImage.scale(0.175);
    
    firstPage.drawImage(qrImage, {
      x: 461, 
      y: 30,
      width: qrImageDims.width,
      height: qrImageDims.height,
    });

    const pdfBytes = await pdfDoc.save();
    pdfBuffers.push(pdfBytes);
  }

  console.log("PDFs generated");

  return pdfBuffers;
};

// Dummy data for testing
const dummyBooking = {
  _id: "1234567890",
  train: "Galu Kumari",
  from: { name: "Station A", platformNumber: 4, departureTime: "10:00 AM" },
  class: "first",
  to: { name: "Station B", arrivalTime: "12:00 PM" },
  date: new Date().toISOString(),
  seats: [
    { _id: "seat1", name: "1A", amount: 50, wagonNumber: 1 },
    { _id: "seat2", name: "2A", amount: 50, wagonNumber: 2 },
  ],
};

// Test the PDF generation function
(async () => {
  try {
    // Generate e-tickets
    const pdfBuffers = await generateETickets(dummyBooking);

    // Save PDFs to disk for verification
    pdfBuffers.forEach((buffer, index) => {
      fs.writeFileSync(`e-ticket-${index + 1}.pdf`, buffer);
    });

    console.log("PDFs generated and saved successfully.");
  } catch (error) {
    console.error("Error:", error);
  }
})();
