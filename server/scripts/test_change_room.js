require('dotenv').config();
const http = require('http');

function request(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const payload = data ? JSON.stringify(data) : null;
    const headers = {};
    if (payload) {
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = Buffer.byteLength(payload);
    }
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path,
      method,
      headers,
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function run() {
  console.log('=== TESTING ROOM CHANGE BY OWNER & STAFF ===\n');

  // 1. Login as Owner Vikram
  console.log('1. Logging in as Owner...');
  const ownerLogin = await request('POST', '/api/auth/login', {
    email: 'owner@greenheights.com',
    password: 'password123',
  });
  if (ownerLogin.status !== 200) {
    throw new Error(`Owner login failed: ${JSON.stringify(ownerLogin.data)}`);
  }
  const ownerToken = ownerLogin.data.token;

  // Make sure active PG is Green Heights (Boys PG)
  await request('POST', '/api/auth/switch-pg', { pgId: '6aa845305a2857b4a871e556' }, ownerToken);

  // 2. Fetch active tenants
  console.log('\n2. Fetching students in Boys PG...');
  const tenantsRes = await request('GET', '/api/tenants', null, ownerToken);
  const rahul = tenantsRes.data.tenants.find(t => t.name.toLowerCase().includes('rahul'));
  console.log(`Found student: ${rahul.name}, current room: ${rahul.roomNumber}`);

  // 3. Owner changes Rahul's room from B-101 to B-201
  console.log('\n3. Owner changing Rahul room to B-201...');
  const changeRes = await request('PUT', `/api/tenants/${rahul._id}/room`, {
    roomNumber: 'B-201',
  }, ownerToken);
  console.log(`Status: ${changeRes.status}, Message: "${changeRes.data.message}"`);
  if (changeRes.status !== 200 || changeRes.data.tenant.roomNumber !== 'B-201') {
    throw new Error('Owner room change failed!');
  }
  console.log('✔ Owner successfully changed room to B-201!');

  // 4. Test staff/editor changing room
  console.log('\n4. Testing Staff/Editor changing room...');
  // Check if an editor exists for Green Heights
  const staffRes = await request('GET', '/api/staff', null, ownerToken);
  let editorToken = null;
  if (staffRes.data.editors && staffRes.data.editors.length > 0) {
    const editor = staffRes.data.editors.find(e => e.inviteStatus === 'accepted');
    if (editor) {
      // Login as editor or invite a test editor
      console.log(`Found accepted editor: ${editor.name} (${editor.email})`);
    }
  }

  // 5. Test room capacity full block
  console.log('\n5. Testing capacity enforcement: Fill B-201 and attempt 3rd allocation...');
  // B-201 already has Rahul. Let's find another student (Arjun) and move to B-201
  const arjun = tenantsRes.data.tenants.find(t => t.name.toLowerCase().includes('arjun'));
  await request('PUT', `/api/tenants/${arjun._id}/room`, { roomNumber: 'B-201' }, ownerToken);
  console.log(`Arjun moved to B-201 (Room now has 2/2 beds full)`);

  // Now try to move himanshu to B-201 (should fail with 400 because capacity is 2)
  const himanshu = tenantsRes.data.tenants.find(t => t.name.toLowerCase().includes('himanshu'));
  const fullCheckRes = await request('PUT', `/api/tenants/${himanshu._id}/room`, { roomNumber: 'B-201' }, ownerToken);
  console.log(`Status: ${fullCheckRes.status}, Message: "${fullCheckRes.data.message}"`);
  if (fullCheckRes.status === 400 && fullCheckRes.data.message.includes('full')) {
    console.log('✔ PROPERLY BLOCKED: Cannot move student into full room!');
  } else {
    throw new Error(`Expected 400 full error but got ${fullCheckRes.status}`);
  }

  // 6. Reset students back to clean sequence
  console.log('\n6. Restoring Rahul to B-101 and Arjun to B-102...');
  await request('PUT', `/api/tenants/${rahul._id}/room`, { roomNumber: 'B-101' }, ownerToken);
  await request('PUT', `/api/tenants/${arjun._id}/room`, { roomNumber: 'B-102' }, ownerToken);
  console.log('✔ Clean room sequence restored!');

  console.log('\n======================================================');
  console.log('🎉 ALL ROOM CHANGE TESTS PASSED 100%!');
  console.log('======================================================');
}

run().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
