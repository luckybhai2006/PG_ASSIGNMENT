require('dotenv').config();
const mongoose = require('mongoose');
const PG = require('../src/models/PG');
const User = require('../src/models/User');

async function check() {
  await mongoose.connect(process.env.MONGO_URI);

  const boysPg = await PG.findById('6aa845305a2857b4a871e556');
  console.log('=== BOYS PG ROOMS ===');
  boysPg.rooms.slice(0, 5).forEach(r => {
    console.log(JSON.stringify(r));
  });

  const girlsPg = await PG.findById('6aab90df9be23d97078d1ec9');
  console.log('\n=== GIRLS PG ROOMS ===');
  girlsPg.rooms.slice(0, 5).forEach(r => {
    console.log(JSON.stringify(r));
  });

  const boysTenants = await User.find({ pgId: boysPg._id, role: 'tenant' });
  console.log('\n=== BOYS TENANTS ===');
  boysTenants.forEach(t => console.log(`${t.name} -> Room: "${t.roomNumber}" (Status: ${t.inviteStatus})`));

  const girlsTenants = await User.find({ pgId: girlsPg._id, role: 'tenant' });
  console.log('\n=== GIRLS TENANTS ===');
  girlsTenants.forEach(t => console.log(`${t.name} -> Room: "${t.roomNumber}" (Status: ${t.inviteStatus})`));

  await mongoose.disconnect();
}

check().catch(console.error);
