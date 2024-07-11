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
      x: 70,
      y: 25,
      size: fontSize,
      color,
    });

    firstPage.drawText(`${booking.date.split("T")[0]}`, {
      x: 394,
      y: 27,
      size: fontSize - 3,
      color,
    });

    firstPage.drawText(`${booking.from.name}`, {
      x: 70,
      y: 62,
      size: fontSize,
      color,
    });

    firstPage.drawText(`${booking.from.name}`, {
        x: 394,
        y: 65,
        size: fontSize - 3,
        color,
      });

    firstPage.drawText(`${booking.train}`, {
        x: 70,
        y: 98,
        size: fontSize,
        color,
      });
    firstPage.drawText(`${booking.train}`, {
      x: 394,
      y: 101,
      size: fontSize - 3,
      color,
    });

    firstPage.drawText(`${booking._id}`, {
        x: 68,
        y: 137,
        size: fontSize,
        color,
      });
    firstPage.drawText(`${booking._id}`, {
      x: 393,
      y: 138,
      size: fontSize - 3,
      color,
    });
    firstPage.drawText(`${booking.from.departureTime}`, {
      x: 182,
      y: 25,
      size: fontSize,
      color,
    });
    firstPage.drawText(`${booking.from.departureTime}`, {
      x: 469,
      y: 27,
      size: fontSize - 3,
      color,
    });
    firstPage.drawText(`${booking.from.platformNumber}`, {
      x: 184,
      y: 98,
      size: fontSize,
      color,
    });

    firstPage.drawText(`${booking.from.platformNumber}`, {
      x: 467,
      y: 101,
      size: fontSize-3,
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

    firstPage.drawText(`${booking.to.arrivalTime}`, {
      x: 546,
      y: 27,
      size: fontSize - 3,
      color,
    });

    firstPage.drawText(`${booking.to.name}`, {
      x: 261,
      y: 62,
      size: fontSize,
      color,
    }); 

    firstPage.drawText(`${booking.to.name}`, {
      x: 514,
      y: 65,
      size: fontSize - 3,
      color,
    }); 

    firstPage.drawText(`${seat.wagonNumber}`, {
      x: 261,
      y: 98,
      size: fontSize,
      color,
    });

    firstPage.drawText(`${seat.wagonNumber}`, {
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

    firstPage.drawText(`${seat.amount}` + 'LKR', {
      x: 295,
      y: 137,
      size: fontSize,
      color,
    });

    firstPage.drawText(`${seat.amount}`+' LKR', {
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
