require('dotenv').config();
const mongoose = require('mongoose');
const PG = require('../src/models/PG');
const User = require('../src/models/User');

async function cleanAndResequence() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  // Helper to generate 3 floors x 5 rooms per floor
  function generateCleanRooms(blockPrefix, capacity = 2) {
    const rooms = [];
    for (let floor = 1; floor <= 3; floor++) {
      for (let num = 1; num <= 5; num++) {
        const rNum = `${blockPrefix}-${floor}0${num}`;
        rooms.push({
          roomNumber: rNum,
          block: `Block ${blockPrefix}`,
          floor: floor,
          capacity: capacity,
        });
      }
    }
    return rooms;
  }

  // 1. Clean & Resequence Boys PG (Green Heights)
  const boysPg = await PG.findById('6aa845305a2857b4a871e556');
  if (boysPg) {
    console.log(`\n--- Cleaning Boys PG: ${boysPg.name} ---`);
    boysPg.rooms = generateCleanRooms('B', 2);
    await boysPg.save();
    console.log(`✔ Replaced all rooms with 15 clean sequenced rooms (B-101 to B-305)`);

    const boysTenants = await User.find({ pgId: boysPg._id, role: 'tenant' }).sort({ createdAt: 1 });
    let roomIdx = 0;
    for (const t of boysTenants) {
      if (t.inviteStatus === 'accepted') {
        const assigned = boysPg.rooms[roomIdx % boysPg.rooms.length].roomNumber;
        t.roomNumber = assigned;
        await t.save();
        console.log(`✔ Reassigned student ${t.name} to clean room ${assigned}`);
        roomIdx++;
      } else {
        t.roomNumber = 'Unassigned';
        await t.save();
        console.log(`✔ Set ${t.name} (${t.inviteStatus}) to Unassigned`);
      }
    }
  }

  // 2. Clean & Resequence Girls PG (girls-PG)
  const girlsPg = await PG.findById('6aab90df9be23d97078d1ec9');
  if (girlsPg) {
    console.log(`\n--- Cleaning Girls PG: ${girlsPg.name} ---`);
    girlsPg.rooms = generateCleanRooms('G', 2);
    await girlsPg.save();
    console.log(`✔ Replaced all rooms with 15 clean sequenced rooms (G-101 to G-305)`);

    const girlsTenants = await User.find({ pgId: girlsPg._id, role: 'tenant' }).sort({ createdAt: 1 });
    let roomIdx = 0;
    for (const t of girlsTenants) {
      if (t.inviteStatus === 'accepted') {
        const assigned = girlsPg.rooms[roomIdx % girlsPg.rooms.length].roomNumber;
        t.roomNumber = assigned;
        await t.save();
        console.log(`✔ Reassigned student ${t.name} to clean room ${assigned}`);
        roomIdx++;
      } else {
        t.roomNumber = 'Unassigned';
        await t.save();
        console.log(`✔ Set ${t.name} (${t.inviteStatus}) to Unassigned`);
      }
    }
  }

  // 3. Clean & Resequence other active PGs (delhi, the lalit)
  const delhiPg = await PG.findById('6aa84774279902a1811158ca');
  if (delhiPg) {
    delhiPg.rooms = generateCleanRooms('D', 2);
    await delhiPg.save();
    const t = await User.findOne({ pgId: delhiPg._id, role: 'tenant' });
    if (t) {
      t.roomNumber = 'D-101';
      await t.save();
    }
    console.log(`✔ Cleaned rooms for Delhi PG`);
  }

  const lalitPg = await PG.findById('6aa906e0080a4004b2bee536');
  if (lalitPg) {
    lalitPg.rooms = generateCleanRooms('L', 2);
    await lalitPg.save();
    const t = await User.findOne({ pgId: lalitPg._id, role: 'tenant' });
    if (t) {
      t.roomNumber = 'L-101';
      await t.save();
    }
    console.log(`✔ Cleaned rooms for The Lalit PG`);
  }

  await mongoose.disconnect();
  console.log('\nAll legacy/manual room numbers completely cleaned and re-sequenced!');
}

cleanAndResequence().catch(err => {
  console.error('Failed to clean rooms:', err);
  process.exit(1);
});
