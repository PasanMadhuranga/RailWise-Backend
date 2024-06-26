import mongoose from 'mongoose';

const wagonSchema = new mongoose.Schema({
    wagonNumber: {
        type: Number,
        required: true,
    },
    wagonClass: {
        type: String,
        required: true,
        enum: ['first class', 'second class', 'third class'],
    },
    seats: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Seat',
        },
    ],
});


const Wagon = mongoose.model('Wagon', wagonSchema);
export default Wagon;