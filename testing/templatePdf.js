import { PDFDocument, rgb } from "pdf-lib";
import fs from "fs";

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
      x: 80,
      y: 25,
      size: fontSize,
      color,
    });

    firstPage.drawText(`${booking.date.split("T")[0]}`, {
      x: 400,
      y: 27,
      size: fontSize - 3,
      color,
    });

    firstPage.drawText(`${booking.from.name}`, {
      x: 80,
      y: 60,
      size: fontSize,
      color,
    });

    firstPage.drawText(`${booking.from.name}`, {
        x: 400,
        y: 67,
        size: fontSize - 3,
        color,
      });

    firstPage.drawText(`${booking.train}`, {
        x: 80,
        y: 87,
        size: fontSize,
        color,
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
