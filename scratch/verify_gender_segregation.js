const http = require('http');

function post(path, data, token = null) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(data);
    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload),
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path,
      method: 'POST',
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
    req.write(payload);
    req.end();
  });
}

function get(path, token = null) {
  return new Promise((resolve, reject) => {
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path,
      method: 'GET',
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
    req.end();
  });
}

async function run() {
  console.log('=== STARTING GENDER SEGREGATION & MULTI-BRANCH VERIFICATION ===');
  const uid = Date.now().toString().slice(-5);

  // 1. Register Owner with Boys PG
  console.log('\n1. Registering Owner with Boys PG...');
  const ownerRes = await post('/api/auth/register-owner', {
    name: `Owner Ramesh ${uid}`,
    email: `ramesh_${uid}@pg.com`,
    password: 'password123',
    phone: '9999988888',
    pgName: `Ramesh Boys PG ${uid}`,
    pgAddress: 'Sector 22, Rohini',
    pgType: 'boys',
  });
  if (ownerRes.status !== 201) {
    throw new Error(`Owner register failed: ${JSON.stringify(ownerRes.data)}`);
  }
  const ownerToken = ownerRes.data.token;
  const boysPg = ownerRes.data.pg;
  console.log('✔ Owner registered successfully! Active PG:', boysPg.name, 'Type:', boysPg.pgType, 'JoinCode:', boysPg.joinCode);

  // 2. Owner adds a second branch: Girls PG
  console.log('\n2. Owner creates second branch: Girls PG...');
  const branchRes = await post('/api/pg/branch', {
    name: `Ramesh Girls PG ${uid}`,
    address: 'Sector 24, Rohini',
    pgType: 'girls',
    curfewTime: '09:30 PM',
    wardenPhone: '9876543210',
    contactPhone: '9999988888',
  }, ownerToken);
  if (branchRes.status !== 201) {
    throw new Error(`Branch create failed: ${JSON.stringify(branchRes.data)}`);
  }
  const girlsPg = branchRes.data.pg;
  console.log('✔ Girls PG branch created! Name:', girlsPg.name, 'Type:', girlsPg.pgType, 'JoinCode:', girlsPg.joinCode);

  // 3. Test multi-branch switching
  console.log('\n3. Testing branch switcher...');
  const switchRes = await post('/api/auth/switch-pg', { pgId: boysPg._id }, ownerToken);
  if (switchRes.status !== 200 || switchRes.data.pg._id !== boysPg._id) {
    throw new Error(`Failed to switch back to Boys PG: ${JSON.stringify(switchRes.data)}`);
  }
  console.log('✔ Switched back to Boys PG:', switchRes.data.pg.name);

  // 4. Test Public PGs filter
  console.log('\n4. Testing public PGs filter...');
  const publicGirls = await get('/api/auth/pgs?pgType=girls');
  const foundInGirls = publicGirls.data.pgs.some(p => p._id === girlsPg._id);
  const foundBoysInGirls = publicGirls.data.pgs.some(p => p._id === boysPg._id);
  console.log('✔ Public Girls query found Girls PG?', foundInGirls, '| Boys PG excluded?', !foundBoysInGirls);

  // 5. Test Male student joining Girls PG (Security Violation Check)
  console.log('\n5. Testing Male student attempting to join Girls PG (Must be rejected)...');
  const maleJoinGirls = await post('/api/auth/register-tenant', {
    name: `Amit Sharma ${uid}`,
    email: `amit_${uid}@test.com`,
    password: 'password123',
    phone: '9876500001',
    gender: 'male',
    pgId: girlsPg._id,
    joinCode: girlsPg.joinCode,
  });
  console.log(`Response status: ${maleJoinGirls.status}, Message: "${maleJoinGirls.data.message}"`);
  if (maleJoinGirls.status === 403) {
    console.log('✔ PROPERLY BLOCKED: Male cannot join Girls PG!');
  } else {
    throw new Error(`Security loophole! Expected 403 but got ${maleJoinGirls.status}`);
  }

  // 6. Test Female student joining Boys PG (Security Violation Check)
  console.log('\n6. Testing Female student attempting to join Boys PG (Must be rejected)...');
  const femaleJoinBoys = await post('/api/auth/register-tenant', {
    name: `Pooja Verma ${uid}`,
    email: `pooja_${uid}@test.com`,
    password: 'password123',
    phone: '9876500002',
    gender: 'female',
    pgId: boysPg._id,
    joinCode: boysPg.joinCode,
  });
  console.log(`Response status: ${femaleJoinBoys.status}, Message: "${femaleJoinBoys.data.message}"`);
  if (femaleJoinBoys.status === 403) {
    console.log('✔ PROPERLY BLOCKED: Female cannot join Boys PG!');
  } else {
    throw new Error(`Security loophole! Expected 403 but got ${femaleJoinBoys.status}`);
  }

  // 7. Test Female student joining Girls PG (Allowed)
  console.log('\n7. Testing Female student joining Girls PG (Allowed)...');
  const femaleJoinGirls = await post('/api/auth/register-tenant', {
    name: `Pooja Verma ${uid}`,
    email: `pooja_${uid}@test.com`,
    password: 'password123',
    phone: '9876500002',
    gender: 'female',
    pgId: girlsPg._id,
    joinCode: girlsPg.joinCode,
  });
  if (femaleJoinGirls.status === 201) {
    console.log('✔ SUCCESS: Female student successfully registered to Girls PG!');
  } else {
    throw new Error(`Failed to register female to Girls PG: ${JSON.stringify(femaleJoinGirls.data)}`);
  }

  // 8. Test Male student joining Boys PG (Allowed)
  console.log('\n8. Testing Male student joining Boys PG (Allowed)...');
  const maleJoinBoys = await post('/api/auth/register-tenant', {
    name: `Amit Sharma ${uid}`,
    email: `amit_${uid}@test.com`,
    password: 'password123',
    phone: '9876500001',
    gender: 'male',
    pgId: boysPg._id,
    joinCode: boysPg.joinCode,
  });
  if (maleJoinBoys.status === 201) {
    console.log('✔ SUCCESS: Male student successfully registered to Boys PG!');
  } else {
    throw new Error(`Failed to register male to Boys PG: ${JSON.stringify(maleJoinBoys.data)}`);
  }

  console.log('\n======================================================');
  console.log('🎉 ALL GENDER SEGREGATION & MULTI-BRANCH TESTS PASSED 100%!');
  console.log('======================================================');
}

run().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
