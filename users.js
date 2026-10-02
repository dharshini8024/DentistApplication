// seedUsers.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGO_URI = 'mongodb+srv://thyagu1798_db_user:XqNH8TEse34ZUCfo@cluster0.gssz0tz.mongodb.net/issai_dental_db?retryWrites=true&w=majority&appName=Cluster0';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['reception', 'chief_doctor', 'doctor'], required: true },
  department: { type: String }
});

const User = mongoose.model('User', userSchema);

async function seed() {
  await mongoose.connect(MONGO_URI);
  await User.deleteMany({}); // Optional: clear existing user collection

  const hashedPassword = await bcrypt.hash('password123', 10);

  const testUsers = [
    { name: 'Receptionist', email: 'reception@clinic.com', password: hashedPassword, role: 'reception', department: 'Front Desk' },
    { name: 'Chief Doctor', email: 'chief@clinic.com', password: hashedPassword, role: 'chief_doctor', department: 'Dental' },
    { name: 'Dr. Smith', email: 'doctor1@clinic.com', password: hashedPassword, role: 'doctor', department: 'Dental' },
    { name: 'Dr. Johnson', email: 'doctor2@clinic.com', password: hashedPassword, role: 'doctor', department: 'Dental' }
  ];

  await User.insertMany(testUsers);
  console.log('✅ Test users successfully created!');
  mongoose.connection.close();
}

seed().catch(err => console.error(err));