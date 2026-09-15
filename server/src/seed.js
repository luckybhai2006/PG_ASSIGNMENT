const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const PG = require('./models/PG');
const Complaint = require('./models/Complaint');

dotenv.config();

const seedData = async () => {
  if (!process.env.MONGO_URI) {
    console.error('❌ Cannot run seed: MONGO_URI is missing in server/.env');
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB for seeding...');

    // Clear existing collections
    await Complaint.deleteMany({});
    await PG.deleteMany({});
    await User.deleteMany({});
    console.log('🧹 Cleared existing database records.');

    // 1. Create Owner
    const owner = new User({
      name: 'Vikram Malhotra',
      email: 'owner@greenheights.com',
      password: 'password123',
      role: 'owner',
      phone: '+91 98765 43210',
      inviteStatus: 'accepted',
    });
    await owner.save();

    // 2. Create PG
    const pg = new PG({
      name: 'Green Heights Premium PG',
      address: 'Plot 42, Sector 2, HSR Layout, Bengaluru, Karnataka 560102',
      ownerId: owner._id,
      contactPhone: '+91 98765 43210',
      rules: [
        'Main gate closes at 10:30 PM.',
        'Quiet hours between 11:00 PM and 6:00 AM.',
        'Turn off AC, geysers, and room lights when not in the room.',
        'Visitors allowed in lounge area only till 8:00 PM.',
      ],
      noticeBoard: [
        {
          title: 'High-speed Fiber Optic Upgrade',
          message: 'Wi-Fi router maintenance scheduled for Sunday from 2 PM to 4 PM. Speed will increase to 300 Mbps.',
          priority: 'normal',
          postedBy: owner._id,
          date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        },
        {
          title: 'Monthly Pest Control Drive',
          message: 'Pest control team will visit all rooms on Saturday between 10 AM and 1 PM. Please cooperate.',
          priority: 'urgent',
          postedBy: owner._id,
          date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        },
      ],
    });
    await pg.save();

    owner.pgId = pg._id;
    await owner.save();

    // 3. Create Staff / Editors
    // Editor 1: Already accepted invite
    const editorAccepted = new User({
      name: 'Sunil Sharma (Manager)',
      email: 'editor@greenheights.com',
      password: 'password123',
      role: 'editor',
      phone: '+91 98111 22233',
      pgId: pg._id,
      invitedBy: owner._id,
      inviteStatus: 'accepted',
    });
    await editorAccepted.save();

    // Editor 2: Pending invite (To demonstrate the accept invite flow!)
    const editorPending = new User({
      name: 'Amit Verma (New Staff)',
      email: 'neweditor@greenheights.com',
      password: 'password123',
      role: 'editor',
      phone: '+91 97222 33344',
      pgId: pg._id,
      invitedBy: owner._id,
      inviteStatus: 'pending',
    });
    await editorPending.save();

    // 4. Create Tenants
    const tenant1 = new User({
      name: 'Rahul Deshmukh',
      email: 'rahul@greenheights.com',
      password: 'password123',
      role: 'tenant',
      roomNumber: '204-B',
      phone: '+91 91234 56789',
      pgId: pg._id,
      invitedBy: owner._id,
      inviteStatus: 'accepted',
    });
    await tenant1.save();

    const tenant2 = new User({
      name: 'Priya Nambiar',
      email: 'priya@greenheights.com',
      password: 'password123',
      role: 'tenant',
      roomNumber: '305-A',
      phone: '+91 92345 67890',
      pgId: pg._id,
      invitedBy: editorAccepted._id,
      inviteStatus: 'accepted',
    });
    await tenant2.save();

    const tenant3 = new User({
      name: 'Arjun Mehta',
      email: 'arjun@greenheights.com',
      password: 'password123',
      role: 'tenant',
      roomNumber: '102-C',
      phone: '+91 93456 78901',
      pgId: pg._id,
      invitedBy: owner._id,
      inviteStatus: 'accepted',
    });
    await tenant3.save();

    // 5. Create Sample Complaints
    const complaints = [
      {
        title: 'Geyser not heating water in bathroom',
        description: 'The bathroom geyser indicator turns on but water stays cold even after 30 minutes.',
        category: 'Electricity',
        priority: 'High',
        status: 'In Progress',
        pgId: pg._id,
        tenantId: tenant1._id,
        roomNumber: '204-B',
        registeredBy: tenant1._id,
        registeredByType: 'tenant',
        resolutionNotes: 'Electrician visited, replacement heating coil ordered. Will fix by evening.',
        timeline: [
          {
            status: 'Pending',
            note: 'Complaint submitted by tenant',
            changedBy: tenant1._id,
            changedByName: tenant1.name,
            timestamp: new Date(Date.now() - 36 * 60 * 60 * 1000),
          },
          {
            status: 'In Progress',
            note: 'Sunil (Manager) assigned electrician Manoj.',
            changedBy: editorAccepted._id,
            changedByName: editorAccepted.name,
            timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
          },
        ],
      },
      {
        title: 'Slow Wi-Fi speed and frequent disconnections',
        description: 'Wi-Fi signal keeps dropping every 15 minutes in room 305-A, unable to attend video calls.',
        category: 'Wi-Fi',
        priority: 'Urgent',
        status: 'Pending',
        pgId: pg._id,
        tenantId: tenant2._id,
        roomNumber: '305-A',
        registeredBy: tenant2._id,
        registeredByType: 'tenant',
        timeline: [
          {
            status: 'Pending',
            note: 'Complaint submitted by tenant',
            changedBy: tenant2._id,
            changedByName: tenant2.name,
            timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
          },
        ],
      },
      {
        title: 'Leaking washbasin tap',
        description: 'Water continuously dripping from the tap spout, making noise and wasting water.',
        category: 'Plumbing',
        priority: 'Medium',
        status: 'Resolved',
        pgId: pg._id,
        tenantId: tenant3._id,
        roomNumber: '102-C',
        registeredBy: editorAccepted._id, // Registered on tenant's behalf by staff!
        registeredByType: 'staff',
        resolutionNotes: 'Washer replaced and valve tightened by plumber Ramesh. Tested and no leak.',
        resolvedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        timeline: [
          {
            status: 'Pending',
            note: 'Registered by editor (Sunil Sharma) on behalf of tenant',
            changedBy: editorAccepted._id,
            changedByName: editorAccepted.name,
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
          {
            status: 'In Progress',
            note: 'Plumber dispatched',
            changedBy: editorAccepted._id,
            changedByName: editorAccepted.name,
            timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
          },
          {
            status: 'Resolved',
            note: 'Washer replaced and valve tightened. Tested successfully.',
            changedBy: editorAccepted._id,
            changedByName: editorAccepted.name,
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          },
        ],
      },
      {
        title: 'Room door lock latch jamming',
        description: 'The key gets stuck while turning and door is hard to lock from outside.',
        category: 'Carpentry',
        priority: 'Medium',
        status: 'Pending',
        pgId: pg._id,
        tenantId: tenant1._id,
        roomNumber: '204-B',
        registeredBy: owner._id, // Registered by owner on behalf of tenant!
        registeredByType: 'staff',
        timeline: [
          {
            status: 'Pending',
            note: 'Registered by owner (Vikram Malhotra) on behalf of tenant',
            changedBy: owner._id,
            changedByName: owner.name,
            timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
          },
        ],
      },
    ];

    for (const c of complaints) {
      await new Complaint(c).save();
    }

    console.log('\n🎉 Demo Data Seeded Successfully!');
    console.log('----------------------------------------------------');
    console.log('📌 PG NAME: Green Heights Premium PG');
    console.log('👑 OWNER:');
    console.log('   Email: owner@greenheights.com  | Password: password123');
    console.log('🛠️  STAFF (EDITOR - ACCEPTED):');
    console.log('   Email: editor@greenheights.com | Password: password123');
    console.log('⏳ STAFF (EDITOR - PENDING INVITE ACCEPTANCE):');
    console.log('   Email: neweditor@greenheights.com | Password: password123');
    console.log('🏠 TENANTS:');
    console.log('   Email: rahul@greenheights.com  | Password: password123 (Room 204-B)');
    console.log('   Email: priya@greenheights.com  | Password: password123 (Room 305-A)');
    console.log('   Email: arjun@greenheights.com  | Password: password123 (Room 102-C)');
    console.log('----------------------------------------------------');

    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
};

seedData();
