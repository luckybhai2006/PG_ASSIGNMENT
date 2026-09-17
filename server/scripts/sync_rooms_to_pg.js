require('dotenv').config();
const mongoose = require('mongoose');
const PG = require('../src/models/PG');
const User = require('../src/models/User');

async function syncRooms() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB');

  const pgs = await PG.find({});

  for (const pg of pgs) {
    if (!pg.rooms) pg.rooms = [];

    const existingRoomNumbers = new Set(pg.rooms.map(r => r.roomNumber.toUpperCase()));

    // Find all active tenants in this PG
    const tenants = await User.find({
      pgId: pg._id,
      role: 'tenant',
      inviteStatus: 'accepted',
    });

    let addedCount = 0;
    for (const t of tenants) {
      const rNum = (t.roomNumber || '').trim().toUpperCase();
      if (rNum && rNum !== 'UNASSIGNED' && !existingRoomNumbers.has(rNum)) {
        // Parse floor if possible (e.g. 204-B -> floor 2, 604-N -> floor 6, 102-C -> floor 1)
        const matchFloor = rNum.match(/\b([1-9])\d{2}\b/);
        const parsedFloor = matchFloor ? parseInt(matchFloor[1], 10) : 1;

        pg.rooms.push({
          roomNumber: rNum,
          block: '',
          floor: parsedFloor,
          capacity: 2,
        });
        existingRoomNumbers.add(rNum);
        addedCount++;
        console.log(`Added room ${rNum} (Floor ${parsedFloor}, Capacity 2) to PG "${pg.name}"`);
      }
    }

    if (addedCount > 0) {
      await pg.save();
      console.log(`Saved ${addedCount} room(s) to PG "${pg.name}"`);
    }
  }

  await mongoose.disconnect();
  console.log('Room sync complete!');
}

syncRooms().catch(console.error);
