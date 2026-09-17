require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');
const PG = require('../src/models/PG');
const { getRooms } = require('../src/controllers/pgController');

async function test() {
  await mongoose.connect(process.env.MONGO_URI);

  // Test with owner of Green Heights / girls-PG
  const owner = await User.findOne({ email: 'owner@greenheights.com' });
  const girlsPg = await PG.findById('6aab90df9be23d97078d1ec9');
  const boysPg = await PG.findById('6aa845305a2857b4a871e556');

  console.log('=== GIRLS PG ROOMS STATUS ===');
  const reqGirls = { user: { _id: owner._id, pgId: girlsPg._id } };
  let girlsResData = null;
  const resGirls = {
    json: (data) => { girlsResData = data; return data; },
    status: () => resGirls,
  };
  await getRooms(reqGirls, resGirls);

  console.log('Stats:', girlsResData.stats);
  girlsResData.rooms.forEach(r => {
    if (r.occupied > 0) {
      console.log(`Room ${r.roomNumber}: Occupied=${r.occupied}/${r.capacity}, Available=${r.available}, isFull=${r.isFull}, Residents=${r.residents.map(x=>x.name).join(', ')}`);
    }
  });

  console.log('\n=== BOYS PG ROOMS STATUS ===');
  const reqBoys = { user: { _id: owner._id, pgId: boysPg._id } };
  let boysResData = null;
  const resBoys = {
    json: (data) => { boysResData = data; return data; },
    status: () => resBoys,
  };
  await getRooms(reqBoys, resBoys);

  console.log('Stats:', boysResData.stats);
  boysResData.rooms.forEach(r => {
    if (r.occupied > 0) {
      console.log(`Room ${r.roomNumber}: Occupied=${r.occupied}/${r.capacity}, Available=${r.available}, isFull=${r.isFull}, Residents=${r.residents.map(x=>x.name).join(', ')}`);
    }
  });

  await mongoose.disconnect();
}

test().catch(console.error);
