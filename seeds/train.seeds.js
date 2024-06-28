import Train from '../models/train.model.js';
import Wagon from '../models/wagon.model.js';

// Function to create train data
const populateTrains = async () => {
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

    console.log('Trains successfully populated');
  } catch (error) {
    console.error('Error populating trains:', error);
  }
};

export default populateTrains;
