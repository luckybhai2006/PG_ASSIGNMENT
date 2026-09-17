require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');
const PG = require('../src/models/PG');
const Complaint = require('../src/models/Complaint');

async function migrate() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  // Find Green Heights (Boys PG) and girls-PG (Girls PG)
  const boysPg = await PG.findById('6aa845305a2857b4a871e556');
  const girlsPg = await PG.findById('6aab90df9be23d97078d1ec9');

  if (!boysPg || !girlsPg) {
    throw new Error('Could not find source or destination PG');
  }

  console.log(`Source PG: ${boysPg.name} (${boysPg.pgType}) [${boysPg._id}]`);
  console.log(`Target PG: ${girlsPg.name} (${girlsPg.pgType}) [${girlsPg._id}]`);

  // Target girl students in Green Heights
  const girlEmails = [
    'priya@greenheights.com',
    'priy@gmail.com',
    'divya@gmail.com',
  ];

  const girls = await User.find({
    pgId: boysPg._id,
    $or: [
      { email: { $in: girlEmails } },
      { name: { $regex: /(priya|divya|pooja|neha|anjali|sneha|riya|swati)/i } }
    ]
  });

  console.log(`\nFound ${girls.length} female tenant(s) in Boys PG to migrate:`);
  girls.forEach(g => console.log(`- ${g.name} (${g.email}) in room ${g.roomNumber}`));

  for (const girl of girls) {
    // 1. Update user gender and pgId
    girl.gender = 'female';
    girl.pgId = girlsPg._id;
    await girl.save();

    // 2. Move girl's complaints to girls-PG
    const complaintUpdate = await Complaint.updateMany(
      { tenantId: girl._id },
      { $set: { pgId: girlsPg._id } }
    );

    console.log(`✔ Moved ${girl.name} to "${girlsPg.name}". Complaints updated: ${complaintUpdate.modifiedCount}`);
  }

  // If girls-PG has no rooms yet, let's create a default set of clean rooms for it!
  if (!girlsPg.rooms || girlsPg.rooms.length === 0) {
    girlsPg.rooms = [
      { roomNumber: 'G-101', floor: 1, block: 'Wing A', capacity: 2 },
      { roomNumber: 'G-102', floor: 1, block: 'Wing A', capacity: 2 },
      { roomNumber: 'G-103', floor: 1, block: 'Wing A', capacity: 2 },
      { roomNumber: 'G-201', floor: 2, block: 'Wing A', capacity: 2 },
      { roomNumber: 'G-202', floor: 2, block: 'Wing A', capacity: 2 },
      { roomNumber: 'G-203', floor: 2, block: 'Wing A', capacity: 2 },
      { roomNumber: 'G-301', floor: 3, block: 'Wing A', capacity: 2 },
      { roomNumber: 'G-302', floor: 3, block: 'Wing A', capacity: 2 },
    ];
    await girlsPg.save();
    console.log(`✔ Initialized ${girlsPg.rooms.length} rooms for "${girlsPg.name}"`);
  }

  console.log('\n--- VERIFICATION AFTER MIGRATION ---');
  const girlsInTarget = await User.find({ pgId: girlsPg._id, role: 'tenant' });
  console.log(`Total students now in ${girlsPg.name}: ${girlsInTarget.length}`);
  girlsInTarget.forEach(g => {
    console.log(`- ${g.name} (${g.gender}) | Room: ${g.roomNumber}`);
  });

  const complaintsInTarget = await Complaint.find({ pgId: girlsPg._id });
  console.log(`Total complaints now in ${girlsPg.name}: ${complaintsInTarget.length}`);
  complaintsInTarget.forEach(c => {
    console.log(`- [${c.status}] ${c.title}`);
  });

  await mongoose.disconnect();
  console.log('\nMigration completed successfully!');
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
