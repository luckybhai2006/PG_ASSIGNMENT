require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');
const PG = require('../src/models/PG');
const Complaint = require('../src/models/Complaint');

async function inspectRoomsAndComplaints() {
  await mongoose.connect(process.env.MONGO_URI);

  const greenHeights = await PG.findById('6aa845305a2857b4a871e556');
  console.log('Green Heights rooms count:', greenHeights.rooms?.length);
  if (greenHeights.rooms?.length) {
    greenHeights.rooms.forEach(r => console.log(`Room ${r.roomNumber}, Block: ${r.block}, Floor: ${r.floor}, Beds: ${r.beds}`));
  }

  const girlsPg = await PG.findById('6aab90df9be23d97078d1ec9');
  console.log('\nGirls-PG:', girlsPg.name, 'Rooms count:', girlsPg.rooms?.length);

  const complaints = await Complaint.find({}).populate('tenantId', 'name email');
  console.log('\n--- COMPLAINTS ---');
  complaints.forEach(c => {
    console.log(`Complaint "${c.title}", Tenant: ${c.tenantId?.name} (${c.tenantId?.email}), PG: ${c.pgId}`);
  });

  await mongoose.disconnect();
}

inspectRoomsAndComplaints().catch(console.error);
