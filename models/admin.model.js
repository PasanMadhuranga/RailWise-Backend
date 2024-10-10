import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const adminSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
});

adminSchema.pre("save", async function (next) {
    if (!this.isModified("password")) { // If the password is not modified, move to the next middleware
        next();
    }
    // Hash the password
    const salt = await bcrypt.genSalt(12);
    // Set the password to the hashed password
    this.password = await bcrypt.hash(this.password, salt);
    next();
    }
);

const Admin = mongoose.model("Admin", adminSchema);

export default Admin;