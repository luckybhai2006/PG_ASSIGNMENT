require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');
const PG = require('../src/models/PG');
const Complaint = require('../src/models/Complaint');

async function inspect() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB');

  const pgs = await PG.find({});
  console.log('\n--- ALL PGS IN DB ---');
  pgs.forEach(p => {
    console.log(`ID: ${p._id}, Name: "${p.name}", Type: ${p.pgType}, Owner: ${p.ownerId}`);
  });

  const users = await User.find({ role: 'tenant' }).populate('pgId', 'name pgType');
  console.log('\n--- ALL TENANTS IN DB ---');
  users.forEach(u => {
    console.log(`ID: ${u._id}, Name: "${u.name}", Gender: ${u.gender}, Email: ${u.email}, Room: ${u.roomNumber}, PG: "${u.pgId?.name}" (${u.pgId?.pgType})`);
  });

  await mongoose.disconnect();
}

inspect().catch(err => {
  console.error(err);
  process.exit(1);
});
