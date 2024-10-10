import mongoose from 'mongoose';

const wagonSchema = new mongoose.Schema({
    wagonNumber: {
        type: Number,
        required: true,
    },
    wagonClassRef: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'WagonClass',
        required: true,
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