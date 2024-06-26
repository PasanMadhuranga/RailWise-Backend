import mongoose from 'mongoose';
import Train from '../models/train.model.js';
import Wagon from '../models/wagon.model.js';

const dbUrl = "mongodb://127.0.0.1:27017/train-booking-test";

// Connect to MongoDB
mongoose.connect(dbUrl)
.then(() => {
    console.log('Connected to MongoDB');
})
.catch(err => {
    console.error('Error connecting to MongoDB', err);
});

// Function to create train data
const createTrains = async () => {
  try {
    // Check if trains already exist
    const existingTrains = await Train.find({});
    if (existingTrains.length > 0) {
      console.log('Trains already populated');
      return;
    }

    const wagons = await Wagon.find({});
    await Train.insertMany([
      { name: 'Galu Kumari', wagons: wagons.slice(0, 5).map(wagon => wagon._id) }, 
      { name: 'Rajarata Rajina', wagons: wagons.slice(5, 8).map(wagon => wagon._id) },
      { name: 'Uttara Devi', wagons: wagons.slice(8, 10).map(wagon => wagon._id) },
    ]);
  } catch (error) {
    console.error('Error populating trains:', error);
  } finally {
    console.log('Trains populated successfully');
    mongoose.connection.close();
  }
};

createTrains();
