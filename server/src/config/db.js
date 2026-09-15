const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  if (isConnected && mongoose.connection.readyState === 1) {
    return true;
  }

  const uri = process.env.MONGO_URI;

  if (!uri || uri.trim() === '') {
    throw new Error('MONGO_URI is missing in Vercel Environment Variables. Please go to Vercel -> Project Settings -> Environment Variables and add MONGO_URI.');
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
    });
    isConnected = true;
    console.log(`✅ MongoDB Connected successfully: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    throw new Error(`MongoDB Connection Error: ${error.message}. Please check MongoDB Atlas Network Access (Allow 0.0.0.0/0).`);
  }
};

module.exports = connectDB;
