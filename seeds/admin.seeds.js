import Admin from "../models/admin.model.js";

const admins = [
  {
    username: "FirstAdmin",
    email: "FirstAdmin@example.com",
    password: "FirstAdmin",
  },
  {
    username: "SecondAdmin",
    email: "SecondAdmin@example.com",
    password: "SecondAdmin",
  },
  {
    username: "ThirdAdmin",
    email: "ThirdAdmin@example.com",
    password: "ThirdAdmin",
  },
];

const populateAdmins = async () => {
  try {
    for (const admin of admins) {
      const newAdmin = new Admin({ ...admin, password: admin.password });
      await newAdmin.save();
    }
    console.log("Admins successfully populated");
  } catch (error) {
    console.error("Error populating admins:", error);
  }
};

export default populateAdmins;
