const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri || uri.trim() === '') {
    console.warn('\n⚠️  WARNING: MONGO_URI is not defined in server/.env file.');
    console.warn('👉  Please open server/.env and paste your MongoDB Atlas URI in MONGO_URI=\n');
    return false;
  }

  try {
    const conn = await mongoose.connect(uri);
    console.log(`✅ MongoDB Connected successfully: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    console.error('👉 Please check your MongoDB Atlas credentials and IP Whitelist (allow 0.0.0.0/0).');
    return false;
  }
};

module.exports = connectDB;
