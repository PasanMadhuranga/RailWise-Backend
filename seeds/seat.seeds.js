import Seat from "../models/seat.model.js";

const firstSeats = [
  { id: "1A", x: 12, y: 12 },
  { id: "1B", x: 92, y: 12 },
  { id: "1C", x: 220, y: 12 },
  { id: "1D", x: 300, y: 12 },

  { id: "2A", x: 12, y: 88 },
  { id: "2B", x: 92, y: 88 },
  { id: "2C", x: 220, y: 88 },
  { id: "2D", x: 300, y: 88 },

  { id: "3A", x: 12, y: 164 },
  { id: "3B", x: 92, y: 164 },
  { id: "3C", x: 220, y: 164 },
  { id: "3D", x: 300, y: 164 },

  { id: "4A", x: 12, y: 240 },
  { id: "4B", x: 92, y: 240 },
  { id: "4C", x: 220, y: 240 },
  { id: "4D", x: 300, y: 240 },

  { id: "5A", x: 12, y: 316 },
  { id: "5B", x: 92, y: 316 },
  { id: "5C", x: 220, y: 316 },
  { id: "5D", x: 300, y: 316 },

  { id: "6A", x: 12, y: 392 },
  { id: "6B", x: 92, y: 392 },
  { id: "6C", x: 220, y: 392 },
  { id: "6D", x: 300, y: 392 },

  { id: "7A", x: 12, y: 468 },
  { id: "7B", x: 92, y: 468 },
  { id: "7C", x: 220, y: 468 },
  { id: "7D", x: 300, y: 468 },

  { id: "8A", x: 12, y: 544 },
  { id: "8B", x: 92, y: 544 },
  { id: "8C", x: 220, y: 544 },
  { id: "8D", x: 300, y: 544 },
];

const secondSeats = [
  { id: "1A", x: 12, y: 12 },
  { id: "1B", x: 66, y: 12 },
  { id: "1C", x: 120, y: 12 },
  { id: "1D", x: 246, y: 12 },
  { id: "1E", x: 300, y: 12 },

  { id: "2A", x: 12, y: 88 },
  { id: "2B", x: 66, y: 88 },
  { id: "2C", x: 120, y: 88 },
  { id: "2D", x: 246, y: 88 },
  { id: "2E", x: 300, y: 88 },

  { id: "3A", x: 12, y: 164 },
  { id: "3B", x: 66, y: 164 },
  { id: "3C", x: 120, y: 164 },
  { id: "3D", x: 246, y: 164 },
  { id: "3E", x: 300, y: 164 },

  { id: "4A", x: 12, y: 240 },
  { id: "4B", x: 66, y: 240 },
  { id: "4C", x: 120, y: 240 },
  { id: "4D", x: 246, y: 240 },
  { id: "4E", x: 300, y: 240 },

  { id: "5A", x: 12, y: 316 },
  { id: "5B", x: 66, y: 316 },
  { id: "5C", x: 120, y: 316 },
  { id: "5D", x: 246, y: 316 },
  { id: "5E", x: 300, y: 316},

  { id: "6A", x: 12, y: 392 },
  { id: "6B", x: 66, y: 392 },
  { id: "6C", x: 120, y: 392 },
  { id: "6D", x: 246, y: 392 },
  { id: "6E", x: 300, y: 392 },

  { id: "7A", x: 12, y: 468 },
  { id: "7B", x: 66, y: 468 },
  { id: "7C", x: 120, y: 468 },
  { id: "7D", x: 246, y: 468 },
  { id: "7E", x: 300, y: 468 },

  { id: "8A", x: 12, y: 544 },
  { id: "8B", x: 66, y: 544 },
  { id: "8C", x: 120, y: 544 },
  { id: "8D", x: 246, y: 544 },
  { id: "8E", x: 300, y: 544 },
]

const thirdSeats = [
  { id: "1A", x: 12, y: 12 },
  { id: "1B", x: 60, y: 12 },
  { id: "1C", x: 108, y: 12 },
  { id: "1D", x: 204, y: 12 },
  { id: "1E", x: 252, y: 12 },
  { id: "1F", x: 300, y: 12 },

  { id: "2A", x: 12, y: 80 },
  { id: "2B", x: 60, y: 80 },
  { id: "2C", x: 108, y: 80 },
  { id: "2D", x: 204, y: 80 },
  { id: "2E", x: 252, y: 80 },
  { id: "2F", x: 300, y: 80 },

  { id: "3A", x: 12, y: 128 },
  { id: "3B", x: 60, y: 128 },
  { id: "3C", x: 108, y: 128 },
  { id: "3D", x: 204, y: 128 },
  { id: "3E", x: 252, y: 128 },
  { id: "3F", x: 300, y: 128 },

  { id: "4A", x: 12, y: 196 },
  { id: "4B", x: 60, y: 196 },
  { id: "4C", x: 108, y: 196 },
  { id: "4D", x: 204, y: 196 },
  { id: "4E", x: 252, y: 196 },
  { id: "4F", x: 300, y: 196 },

  { id: "5A", x: 12, y: 244 },
  { id: "5B", x: 60, y: 244 },
  { id: "5C", x: 108, y: 244 },
  { id: "5D", x: 204, y: 244 },
  { id: "5E", x: 252, y: 244 },
  { id: "5F", x: 300, y: 244 },

  { id: "6A", x: 12, y: 312 },
  { id: "6B", x: 60, y: 312 },
  { id: "6C", x: 108, y: 312 },
  { id: "6D", x: 204, y: 312 },
  { id: "6E", x: 252, y: 312 },
  { id: "6F", x: 300, y: 312 },

  { id: "7A", x: 12, y: 360 },
  { id: "7B", x: 60, y: 360 },
  { id: "7C", x: 108, y: 360 },
  { id: "7D", x: 204, y: 360 },
  { id: "7E", x: 252, y: 360 },
  { id: "7F", x: 300, y: 360 },

  { id: "8A", x: 12, y: 428 },
  { id: "8B", x: 60, y: 428 },
  { id: "8C", x: 108, y: 428 },
  { id: "8D", x: 204, y: 428 },
  { id: "8E", x: 252, y: 428 },
  { id: "8F", x: 300, y: 428 },

  { id: "9A", x: 12, y: 476 },
  { id: "9B", x: 60, y: 476 },
  { id: "9C", x: 108, y: 476 },
  { id: "9D", x: 204, y: 476 },
  { id: "9E", x: 252, y: 476 },
  { id: "9F", x: 300, y: 476 },

  { id: "10A", x: 12, y: 544 },
  { id: "10B", x: 60, y: 544 },
  { id: "10C", x: 108, y: 544 },
  { id: "10D", x: 204, y: 544 },
  { id: "10E", x: 252, y: 544 },
  { id: "10F", x: 300, y: 544 },
];

const populateSeats = async () => {
  try {
    await Seat.insertMany([
      ...firstSeats.map((seat) => ({
        name: seat.id,
        position: [seat.x, seat.y],
      })), // first class of Galu Kumari
      ...secondSeats.map((seat) => ({
        name: seat.id,
        position: [seat.x, seat.y],
      })), // second class of Galu Kumari
      ...secondSeats.map((seat) => ({
        name: seat.id,
        position: [seat.x, seat.y],
      })), // second class of Galu Kumari
      ...thirdSeats.map((seat) => ({
        name: seat.id,
        position: [seat.x, seat.y],
      })), // third class of Galu Kumari
      ...thirdSeats.map((seat) => ({
        name: seat.id,
        position: [seat.x, seat.y],
      })), // third class of Galu Kumari

      ...firstSeats.map((seat) => ({
        name: seat.id,
        position: [seat.x, seat.y],
      })), // first class of Rajarata Rajina
      ...secondSeats.map((seat) => ({
        name: seat.id,
        position: [seat.x, seat.y],
      })), // second class of Rajarata Rajina
      ...secondSeats.map((seat) => ({
        name: seat.id,
        position: [seat.x, seat.y],
      })), // second class of Rajarata Rajina

      ...secondSeats.map((seat) => ({
        name: seat.id,
        position: [seat.x, seat.y],
      })), // second class of Uttara Devi
      ...thirdSeats.map((seat) => ({
        name: seat.id,
        position: [seat.x, seat.y],
      })), // third class of Uttara Devi
    ]);

    console.log("Seats successfully populated");
  } catch (error) {
    console.error("Error populating seats:", error);
  }
};

export default populateSeats;
