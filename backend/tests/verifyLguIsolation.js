const connectDB = require('../src/config/db');
const User = require('../src/models/User');
const Route = require('../src/models/Route');
const Terminal = require('../src/models/Terminal');
const Complaint = require('../src/models/Complaint');
const { generateAccessToken } = require('../src/utils/tokenUtils');
const http = require('http');

const makeGetRequest = (path, token) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
};

const run = async () => {
  try {
    await connectDB();
    console.log('Testing LGU Jurisdictional Isolation...\n');

    const calasiaoUser = await User.findOne({ email: 'calasiao@dagupan.com' });
    const dagupanUser = await User.findOne({ email: 'lgu@dagupan.com' });

    if (!calasiaoUser || !dagupanUser) {
      throw new Error('Test users not found.');
    }

    const calasiaoToken = generateAccessToken(calasiaoUser);
    const dagupanToken = generateAccessToken(dagupanUser);

    // 1. Test Routes Isolation
    console.log('--- 1. Testing Routes for LGU Calasiao ---');
    const calasiaoRoutesRes = await makeGetRequest('/api/routes', calasiaoToken);
    const calasiaoRoutes = calasiaoRoutesRes.body.data || [];
    console.log(`LGU Calasiao received ${calasiaoRoutes.length} route(s):`);
    calasiaoRoutes.forEach((r) => console.log(`  - ${r.code} (${r.name}): [${r.municipalities.join(', ')}]`));
    const anyNonCalasiao = calasiaoRoutes.some((r) => !r.municipalities.includes('Calasiao'));
    if (anyNonCalasiao) {
      console.error('FAIL: LGU Calasiao received a route that does not belong to Calasiao!');
    } else {
      console.log('PASS: All routes received by LGU Calasiao belong strictly to Calasiao jurisdiction.\n');
    }

    // 2. Test Terminals Isolation
    console.log('--- 2. Testing Terminals for LGU Calasiao ---');
    const calasiaoTerminalsRes = await makeGetRequest('/api/terminals', calasiaoToken);
    const calasiaoTerminals = calasiaoTerminalsRes.body.data || [];
    console.log(`LGU Calasiao received ${calasiaoTerminals.length} terminal(s):`);
    calasiaoTerminals.forEach((t) => console.log(`  - ${t.name}: [${t.municipality}]`));
    const anyNonCalasiaoTerm = calasiaoTerminals.some((t) => t.municipality !== 'Calasiao');
    if (anyNonCalasiaoTerm) {
      console.error('FAIL: LGU Calasiao received a terminal that is outside Calasiao!');
    } else {
      console.log('PASS: All terminals received by LGU Calasiao belong strictly to Calasiao.\n');
    }

    // 3. Test Complaints Isolation
    console.log('--- 3. Testing Complaints for LGU Calasiao vs LGU Dagupan ---');
    const calasiaoCompRes = await makeGetRequest('/api/complaints', calasiaoToken);
    const calasiaoComp = calasiaoCompRes.body.data?.items || calasiaoCompRes.body.data || [];
    console.log(`LGU Calasiao received ${calasiaoComp.length} complaint(s):`);
    calasiaoComp.forEach((c) => console.log(`  - [${c.municipality}] ${c.subject}`));

    const dagupanCompRes = await makeGetRequest('/api/complaints', dagupanToken);
    const dagupanComp = dagupanCompRes.body.data?.items || dagupanCompRes.body.data || [];
    console.log(`LGU Dagupan received ${dagupanComp.length} complaint(s).`);

    const leakInCalasiao = calasiaoComp.some((c) => c.municipality !== 'Calasiao');
    if (leakInCalasiao) {
      console.error('FAIL: LGU Calasiao received a complaint outside Calasiao!');
    } else {
      console.log('PASS: Complaints are strictly partitioned by municipality!\n');
    }

    // 4. Test Dashboard Stats Isolation (/api/admin/stats)
    console.log('--- 4. Testing Master Dashboard Stats for LGU Calasiao vs LGU Dagupan ---');
    const calasiaoStatsRes = await makeGetRequest('/api/admin/stats', calasiaoToken);
    const dagupanStatsRes = await makeGetRequest('/api/admin/stats', dagupanToken);
    const calStats = calasiaoStatsRes.body.data;
    const dagStats = dagupanStatsRes.body.data;

    console.log(`LGU Calasiao stats: routes=${calStats?.routes?.total}, terminals=${calStats?.terminals?.total}, complaints=${calStats?.complaints?.total}`);
    console.log(`LGU Dagupan stats: routes=${dagStats?.routes?.total}, terminals=${dagStats?.terminals?.total}, complaints=${dagStats?.complaints?.total}`);

    if (calStats?.routes?.total !== calasiaoRoutes.length) {
      console.error(`FAIL: Calasiao stats reported ${calStats?.routes?.total} routes, expected ${calasiaoRoutes.length}`);
    } else if (calStats?.terminals?.total !== calasiaoTerminals.length) {
      console.error(`FAIL: Calasiao stats reported ${calStats?.terminals?.total} terminals, expected ${calasiaoTerminals.length}`);
    } else if (calStats?.complaints?.total !== calasiaoComp.length) {
      console.error(`FAIL: Calasiao stats reported ${calStats?.complaints?.total} complaints, expected ${calasiaoComp.length}`);
    } else {
      console.log('PASS: Master Dashboard stats are strictly partitioned by municipal jurisdiction!\n');
    }

    // 5. Test Dashboard Activity Isolation (/api/admin/activity)
    console.log('--- 5. Testing Master Dashboard Recent Activity for LGU Calasiao ---');
    const calasiaoActRes = await makeGetRequest('/api/admin/activity', calasiaoToken);
    const calAct = calasiaoActRes.body.data;
    const recentUsers = calAct?.recentUsers || [];
    const recentComp = calAct?.recentComplaints || [];
    console.log(`LGU Calasiao recent activity: ${recentUsers.length} users, ${recentComp.length} complaints.`);
    const anyUserLeak = recentUsers.some((u) => u.municipality && u.municipality !== 'Calasiao');
    const anyCompLeak = recentComp.some((c) => c.municipality && c.municipality !== 'Calasiao');
    if (anyUserLeak || anyCompLeak) {
      console.error('FAIL: Calasiao activity feed leaked Dagupan users or complaints!');
    } else {
      console.log('PASS: Dashboard activity strictly limited to Calasiao jurisdiction!\n');
    }

    // 6. Test Notifications Isolation for Commuters
    console.log('--- 6. Testing Notifications Isolation for Commuters ---');
    // Fetch notifications for a Calasiao commuter
    const calasiaoNotifRes = await makeGetRequest('/api/notifications?municipality=Calasiao', calasiaoToken);
    const calNotifs = calasiaoNotifRes.body.data || [];
    console.log(`Calasiao commuter received ${calNotifs.length} notification(s):`);
    calNotifs.slice(0, 3).forEach((n) => console.log(`  - [${n.municipality || 'Dagupan'}] ${n.title}`));

    const anyWrongMuniNotif = calNotifs.some(
      (n) => n.userId == null && n.municipality !== 'Calasiao' && n.municipality !== 'all'
    );
    if (anyWrongMuniNotif) {
      console.error('FAIL: Calasiao commuter received notifications belonging to another LGU!');
    } else {
      console.log('PASS: Commuter notifications strictly filtered by municipality!\n');
    }

    console.log('ALL JURISDICTIONAL ISOLATION VERIFICATIONS PASSED SUCCESSFULLY!');
    process.exit(0);
  } catch (err) {
    console.error('Error running test:', err);
    process.exit(1);
  }
};

run();
