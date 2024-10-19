import User from "../models/user.model.js";

const users = [
    {
        username: "kalum123",
        email: "kalum@example.com",
        password: "password123",
        phone: "0712345678",    },
    {
        username: "nimal456",
        email: "nimal@example.com",
        password: "password456",
        phone: "0723456789",
    },
    {
        username: "amaya789",
        email: "amaya@example.com",
        password: "password789",
        phone: "0734567890",
    },
    {
        username: "sachini123",
        email: "sachini@example.com",
        password: "password123",
        phone: "0745678901",
    },
    {
        username: "mahesh456",
        email: "mahesh@example.com",
        password: "password456",
        phone: "0756789012",
    },
];

async function populateUsersAndCardDetails() {
    try {

        for (const user of users) {
            const newUser = new User({ ...user, password: user.password });
            await newUser.save();
        }
        console.log("Users successfully populated");
    } catch (error) {
        console.error("Error populating users and card details:", error);
    } 
}

export default populateUsersAndCardDetails;
