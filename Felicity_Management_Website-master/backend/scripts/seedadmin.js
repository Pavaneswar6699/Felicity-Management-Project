require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const Admin = require("../models/Admin");

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    const exists = await Admin.findOne({ email: process.env.ADMIN_EMAIL });
    if (exists) {
      console.log("Admin already exists.");
      process.exit();
    }

    const hashed = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);

    await Admin.create({
      email: process.env.ADMIN_EMAIL,
      password: hashed
    });

    console.log("Admin seeded successfully.");
    process.exit();

  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seed();