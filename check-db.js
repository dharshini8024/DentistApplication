const mongoose = require('mongoose');

// Paste your actual MongoDB connection string here (from your server.js or .env file)
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://thyagu1798_db_user:XqNH8TEse34ZUCfo@cluster0.gssz0tz.mongodb.net/issai_dental_db?retryWrites=true&w=majority&appName=Cluster0';

async function inspectAppointments() {
  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected successfully!\n');

    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name));

    const appointments = await mongoose.connection.db
      .collection('appointments')
      .find({})
      .sort({ _id: -1 })
      .limit(3)
      .toArray();

    console.log('\n================ RECORD SAMPLES ================');
    console.log(JSON.stringify(appointments, null, 2));
    console.log('================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('Error reading database:', error.message);
    process.exit(1);
  }
}

inspectAppointments();