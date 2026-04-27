const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Doctor = require('./models/Doctor');
const Appointment = require('./models/Appointment');
const connectDB = require('./config/db');

dotenv.config();

connectDB();

const importData = async () => {
  try {
    await User.deleteMany();
    await Doctor.deleteMany();
    await Appointment.deleteMany();

    const createdUsers = await User.insertMany([
      {
        name: 'Admin User',
        email: 'admin@docbook.com',
        password: 'password123', // Raw password, hashing is in pre-save. But insertMany bypasses pre-save! 
        // Wait, insertMany bypasses schema hooks. Let's create manually for seeding.
      }
    ]);

    // Let's create proper items so hooks trigger
    const admin = new User({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'password123',
      role: 'Admin'
    });
    await admin.save();

    const patient = new User({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      role: 'Patient'
    });
    await patient.save();

    const doctor1 = new Doctor({
      name: 'Dr. Sarah Smith',
      email: 'sarah@example.com',
      password: 'password123',
      specialization: 'Cardiologist',
      experience: 12,
      feesPerCunsultation: 1500,
      about: 'Expert cardiologist with a history of treating complex heart conditions.',
      clinicAddress: '123 Medical Drive, Health City',
      isApproved: true,
      ratings: 4.8,
      numOfReviews: 124,
      availableDays: [
        {
          day: 'Monday',
          slots: [
            { startTime: '09:00', endTime: '10:00' },
            { startTime: '10:00', endTime: '11:00' },
            { startTime: '14:00', endTime: '15:00' }
          ]
        },
        {
          day: 'Wednesday',
          slots: [
            { startTime: '10:00', endTime: '11:00' },
            { startTime: '11:00', endTime: '12:00' }
          ]
        }
      ]
    });
    await doctor1.save();

    const doctor2 = new Doctor({
      name: 'Dr. Michael Chen',
      email: 'michael@example.com',
      password: 'password123',
      specialization: 'Dermatologist',
      experience: 8,
      feesPerCunsultation: 800,
      about: 'Specializes in skin conditions and cosmetic procedures.',
      clinicAddress: 'Skin Care Center, Downtown',
      isApproved: true,
      ratings: 4.6,
      numOfReviews: 89,
      availableDays: [
        {
          day: 'Tuesday',
          slots: [
            { startTime: '11:00', endTime: '12:00' },
            { startTime: '12:00', endTime: '13:00' }
          ]
        },
        {
          day: 'Thursday',
          slots: [
            { startTime: '15:00', endTime: '16:00' },
            { startTime: '16:00', endTime: '17:00' }
          ]
        }
      ]
    });
    await doctor2.save();

    const doctor3 = new Doctor({
      name: 'Dr. Rahul Sharma',
      email: 'rahul@example.com',
      password: 'password123',
      specialization: 'General Physician',
      experience: 5,
      feesPerCunsultation: 500,
      about: 'A dedicated physician with a focus on holistic care.',
      clinicAddress: '45 Green Valley, Suburbs',
      isApproved: false, // PENDING
      availableDays: [
        {
          day: 'Monday',
          slots: [{ startTime: '10:00', endTime: '11:00' }]
        }
      ]
    });
    await doctor3.save();

    console.log('Data Imported!');
    process.exit();
  } catch (error) {
    console.error(`${error}`);
    process.exit(1);
  }
};

const destroyData = async () => {
  try {
    await User.deleteMany();
    await Doctor.deleteMany();
    console.log('Data Destroyed!');
    process.exit();
  } catch (error) {
    console.error(`${error}`);
    process.exit(1);
  }
};

if (process.argv[2] === '-d') {
  destroyData();
} else {
  importData();
}
