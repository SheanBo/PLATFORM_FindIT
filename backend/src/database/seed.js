require('dotenv').config();
const bcrypt = require('bcryptjs');
const { getDb, runAsync, getAsync, allAsync } = require('./init');

async function seed() {
  console.log('🌱 Starting database seed...\n');

  const db = getDb();
  const password = bcrypt.hashSync('Password123!', 10);

  return new Promise((resolve, reject) => {
    db.serialize(async () => {
      try {
        // Insert locations
        const locations = [
          ['Four Pillars', 'Iconic historical landmark at the entrance, built in 1940'],
          ['Henry Sy Sr. Hall', 'Primary Administration Building'],
          ["Fr. James J. O'Brien, S.J. Library", 'Central university library and information hub'],
          ['Christ the King University Church', 'Main place of worship on campus'],
          ['Fr. Hilario Belardo, S.J. Hall', 'Senior High School (SHS) building'],
          ['Engineering Building', 'Houses the College of Science, Engineering, and Architecture'],
          ['Arrupe Hall', 'Contains general classrooms and university offices'],
          ['Xavier Hall', 'Houses various administrative and formation offices'],
          ['Burns Hall', 'Houses institutional offices on the upper floors and the Center for Community Development (CCD) on the ground floor'],
          ['Raul Bonoan, S.J. Building', 'Multi-purpose academic and office facility'],
          ['Madrigal Building', 'Academic facility'],
          ['Santos Building', 'Houses specific offices and classrooms'],
          ['Alingal Hall', 'Multi-purpose university building'],
          ['University Gymnasium', 'Houses the Athletics department and sports facilities'],
          ['Covered Courts', 'Covered sports courts for athletics and school events'],
          ['Jesuit Residence', 'Residence of the Jesuit community on campus'],
        ];

        for (const l of locations) {
          await runAsync('INSERT OR IGNORE INTO LOCATION (Place_Name,Place_Description) VALUES (?,?)', l);
        }
        console.log(`✅ Inserted ${locations.length} locations`);

        // Insert categories
        const categories = [
          ['Wallet', 'Small personal finance holder'],
          ['Phone', 'Mobile phones'],
          ['ID_Card', 'Student and employee IDs'],
          ['Keys', 'House, car, or locker keys'],
          ['Umbrella', 'Umbrellas and parasols'],
          ['Bag', 'Bags and backpacks'],
          ['Clothing', 'Jackets, shirts, clothing'],
          ['Laptop', 'Laptops and netbooks'],
          ['Tablet', 'Tablets and e-readers'],
          ['Documents', 'Papers and printed materials'],
          ['Jewelry', 'Rings, necklaces, earrings'],
          ['Eyewear', 'Glasses and sunglasses'],
          ['Water_Bottle', 'Tumblers and containers'],
          ['Food_Container', 'Lunchboxes'],
          ['Electronics_Accessories', 'Chargers, earphones, cables'],
          ['Other', 'Items that do not fit any standard category'],
        ];

        for (const c of categories) {
          await runAsync('INSERT OR IGNORE INTO ITEM_CATEGORY (Category_Name,Category_Description) VALUES (?,?)', c);
        }
        console.log(`✅ Inserted ${categories.length} categories`);

        // Insert storage sections
        const sections = [
          ['Locker', 'Locker A1', 20],
          ['Locker', 'Locker A2', 20],
          ['Locker', 'Locker B1', 20],
          ['Locker', 'Locker B2', 20],
          ['Locker', 'Others Bin', 20],
          ['Office_Safe', 'Safe 1', 10],
          ['Office_Safe', 'Safe 2', 10],
        ];

        for (const s of sections) {
          await runAsync('INSERT OR IGNORE INTO STORAGE_SECTION (Storage_Type,Section_Name,Capacity) VALUES (?,?,?)', s);
        }
        console.log(`✅ Inserted ${sections.length} storage sections`);

        // Insert users
        const users = [
          { first: 'Admin', last: 'OSA', email: 'admin@adnu.edu.ph', username: 'admin', role: 'Admin', sid: null, dept: 'OSA' },
          { first: 'Staff', last: 'One', email: 'staff1@adnu.edu.ph', username: 'staff1', role: 'Staff', sid: null, dept: 'OSA' },
          { first: 'Staff', last: 'Two', email: 'staff2@adnu.edu.ph', username: 'staff2', role: 'Staff', sid: null, dept: 'OSA' },
          { first: 'Juan', last: 'Dela Cruz', email: 'juan@gbox.adnu.edu.ph', username: 'juan.delacruz', role: 'Student', sid: '2021-00001', dept: 'DCS' },
          { first: 'Maria', last: 'Santos', email: 'maria@gbox.adnu.edu.ph', username: 'maria.santos', role: 'Student', sid: '2021-00002', dept: 'DCS' },
          { first: 'Carlo', last: 'Reyes', email: 'carlo@gbox.adnu.edu.ph', username: 'carlo.reyes', role: 'Student', sid: '2022-00003', dept: 'DCS' },
          { first: 'Ana', last: 'Garcia', email: 'ana@gbox.adnu.edu.ph', username: 'ana.garcia', role: 'Student', sid: '2022-00004', dept: 'CED' },
          { first: 'Luis', last: 'Fernandez', email: 'luis@gbox.adnu.edu.ph', username: 'luis.fernandez', role: 'Student', sid: '2023-00005', dept: 'STEM' },
          { first: 'Rosa', last: 'Villalobos', email: 'rosa@gbox.adnu.edu.ph', username: 'rosa.villalobos', role: 'Student', sid: '2023-00006', dept: 'BSCS' },
        ];

        const userIds = {};
        for (const u of users) {
          await runAsync('INSERT OR IGNORE INTO PERSON (First_Name,Last_Name,Department) VALUES (?,?,?)',
            [u.first, u.last, u.dept]);
          const person = await getAsync('SELECT Person_ID FROM PERSON WHERE First_Name=? AND Last_Name=?',
            [u.first, u.last]);
          if (person) {
            await runAsync('INSERT OR IGNORE INTO ONLINE_USER (Person_ID,Username,Password_Hash,Email,Student_ID,Role_Type) VALUES (?,?,?,?,?,?)',
              [person.Person_ID, u.username, password, u.email, u.sid, u.role]);
            userIds[u.username] = person.Person_ID;
          }
        }
        console.log(`✅ Inserted ${users.length} users`);

        // Get reference data
        const staff = await getAsync('SELECT User_ID FROM ONLINE_USER WHERE Role_Type IN ("Staff","Admin") LIMIT 1', []);
        const student = await getAsync('SELECT User_ID FROM ONLINE_USER WHERE Role_Type="Student" LIMIT 1', []);
        const students = await allAsync('SELECT User_ID FROM ONLINE_USER WHERE Role_Type="Student"', []);

        const catWallet = await getAsync('SELECT Category_ID FROM ITEM_CATEGORY WHERE Category_Name="Wallet"', []);
        const catPhone = await getAsync('SELECT Category_ID FROM ITEM_CATEGORY WHERE Category_Name="Phone"', []);
        const catKeys = await getAsync('SELECT Category_ID FROM ITEM_CATEGORY WHERE Category_Name="Keys"', []);
        const catBag = await getAsync('SELECT Category_ID FROM ITEM_CATEGORY WHERE Category_Name="Bag"', []);
        const catLaptop = await getAsync('SELECT Category_ID FROM ITEM_CATEGORY WHERE Category_Name="Laptop"', []);
        const catEyewear = await getAsync('SELECT Category_ID FROM ITEM_CATEGORY WHERE Category_Name="Eyewear"', []);
        const catJewelry = await getAsync('SELECT Category_ID FROM ITEM_CATEGORY WHERE Category_Name="Jewelry"', []);

        const locMain = await getAsync('SELECT Location_ID FROM LOCATION WHERE Place_Name="Henry Sy Sr. Hall"', []);
        const locLib = await getAsync(`SELECT Location_ID FROM LOCATION WHERE Place_Name="Fr. James J. O'Brien, S.J. Library"`, []);
        const locGym = await getAsync('SELECT Location_ID FROM LOCATION WHERE Place_Name="University Gymnasium"', []);
        const locCanteen = await getAsync('SELECT Location_ID FROM LOCATION WHERE Place_Name="Alingal Hall"', []);
        const locLab = await getAsync('SELECT Location_ID FROM LOCATION WHERE Place_Name="Engineering Building"', []);
        const locParking = await getAsync('SELECT Location_ID FROM LOCATION WHERE Place_Name="Four Pillars"', []);

        const secLocker = await getAsync('SELECT Section_ID FROM STORAGE_SECTION WHERE Storage_Type="Locker" LIMIT 1', []);
        const secSafe = await getAsync('SELECT Section_ID FROM STORAGE_SECTION WHERE Storage_Type="Office_Safe" LIMIT 1', []);

        // Insert found items
        const foundItems = [
          { catId: catWallet.Category_ID, locId: locMain.Location_ID, name: 'Brown Leather Wallet', desc: 'Found near main entrance with cash', color: 'Brown', brand: 'No Brand', secId: secSafe.Section_ID, status: 'Unclaimed', date: '2024-01-15' },
          { catId: catPhone.Category_ID, locId: locLib.Location_ID, name: 'Black Samsung Phone', desc: 'Found on library table, cracked screen', color: 'Black', brand: 'Samsung', secId: secSafe.Section_ID, status: 'Unclaimed', date: '2024-01-20' },
          { catId: catKeys.Category_ID, locId: locGym.Location_ID, name: 'Silver House Keys', desc: 'Found in gym locker room', color: 'Silver', brand: null, secId: secLocker.Section_ID, status: 'Unclaimed', date: '2024-02-01' },
          { catId: catBag.Category_ID, locId: locCanteen.Location_ID, name: 'Blue Backpack', desc: 'Found in canteen, contains school materials', color: 'Blue', brand: 'North Face', secId: secLocker.Section_ID, status: 'Unclaimed', date: '2024-02-05' },
          { catId: catLaptop.Category_ID, locId: locLab.Location_ID, name: 'Dell Laptop', desc: 'HP Pavilion laptop found in computer lab', color: 'Silver', brand: 'HP', secId: null, status: 'Unclaimed', date: '2024-02-10' },
          { catId: catEyewear.Category_ID, locId: locMain.Location_ID, name: 'Ray-Ban Sunglasses', desc: 'Designer sunglasses with case', color: 'Brown', brand: 'Ray-Ban', secId: secSafe.Section_ID, status: 'Unclaimed', date: '2024-02-15' },
          { catId: catJewelry.Category_ID, locId: locLib.Location_ID, name: 'Gold Necklace', desc: 'Found near reference section', color: 'Gold', brand: null, secId: secSafe.Section_ID, status: 'Unclaimed', date: '2024-02-20' },
          { catId: catPhone.Category_ID, locId: locParking.Location_ID, name: 'White iPhone 14', desc: 'iPhone with protective case', color: 'White', brand: 'Apple', secId: secSafe.Section_ID, status: 'Matched', date: '2024-02-25' },
        ];

        let foundItemIds = [];
        for (const item of foundItems) {
          const result = await runAsync(`
            INSERT INTO FOUND_ITEM
              (Category_ID,Location_ID,Item_Name,Item_Description,Item_Color,Item_Brand,Date_Found,Storage_Type,Section_ID,Contact_Staff_ID,Reported_By_User_ID,Found_By_Contact,Item_Status)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
          `, [item.catId, item.locId, item.name, item.desc, item.color, item.brand, item.date, 'Office_Safe', item.secId, staff.User_ID, staff.User_ID, 'Admin Input', item.status]);
          foundItemIds.push(result.lastID);
        }
        console.log(`✅ Inserted ${foundItems.length} found items`);

        // Insert lost reports
        const lostReports = [
          { userId: students[0].User_ID, catId: catWallet.Category_ID, locId: locMain.Location_ID, name: 'Brown Wallet', desc: 'Lost school ID and cash', color: 'Brown', date: '2024-01-15', contact: '09987654321', status: 'Closed' },
          { userId: students[1].User_ID, catId: catPhone.Category_ID, locId: locLib.Location_ID, name: 'Black Samsung Phone', desc: 'Left on library table', color: 'Black', date: '2024-01-20', contact: '09876543210', status: 'Closed' },
          { userId: students[2].User_ID, catId: catKeys.Category_ID, locId: locGym.Location_ID, name: 'House Keys', desc: 'Lost in gym area', color: 'Silver', date: '2024-02-01', contact: '09765432109', status: 'Active' },
          { userId: students[3].User_ID, catId: catBag.Category_ID, locId: locCanteen.Location_ID, name: 'Blue Backpack', desc: 'Lost in canteen with books', color: 'Blue', date: '2024-02-05', contact: '09654321098', status: 'Active' },
          { userId: students[4].User_ID, catId: catLaptop.Category_ID, locId: locLab.Location_ID, name: 'Silver Laptop', desc: 'Left in computer lab', color: 'Silver', date: '2024-02-10', contact: '09543210987', status: 'Active' },
          { userId: students[1].User_ID, catId: catPhone.Category_ID, locId: locParking.Location_ID, name: 'White iPhone 14', desc: 'Left in parking lot', color: 'White', date: '2024-02-25', contact: '09876543210', status: 'Closed' },
        ];

        let lostReportIds = [];
        for (const report of lostReports) {
          const result = await runAsync(`
            INSERT INTO LOST_REPORT
              (User_ID,Category_ID,Location_ID,Item_Name,Item_Description,Item_Color,Date_Lost,Contact_Information,Report_Status)
            VALUES (?,?,?,?,?,?,?,?,?)
          `, [report.userId, report.catId, report.locId, report.name, report.desc, report.color, report.date, report.contact, report.status]);
          lostReportIds.push(result.lastID);
        }
        console.log(`✅ Inserted ${lostReports.length} lost reports`);

        // Insert matches
        const matches = [
          { itemId: foundItemIds[0], reportId: lostReportIds[0], score: 95, status: 'Confirmed', type: 'Auto' },
          { itemId: foundItemIds[1], reportId: lostReportIds[1], score: 92, status: 'Confirmed', type: 'Auto' },
          { itemId: foundItemIds[2], reportId: lostReportIds[2], score: 88, status: 'Pending', type: 'Auto' },
          { itemId: foundItemIds[3], reportId: lostReportIds[3], score: 90, status: 'Pending', type: 'Auto' },
          { itemId: foundItemIds[7], reportId: lostReportIds[5], score: 98, status: 'Confirmed', type: 'Auto' },
        ];

        for (const match of matches) {
          await runAsync(`
            INSERT INTO ITEM_MATCH (Item_ID,Report_ID,Match_Score,Match_Status,Match_Type)
            VALUES (?,?,?,?,?)
          `, [match.itemId, match.reportId, match.score, match.status, match.type]);
        }
        console.log(`✅ Inserted ${matches.length} item matches`);

        // Insert claims
        const claims = [
          { itemId: foundItemIds[0], reportId: lostReportIds[0], userId: students[0].User_ID, status: 'Approved', verified: 'Y', verified_by: staff.User_ID },
          { itemId: foundItemIds[1], reportId: lostReportIds[1], userId: students[1].User_ID, status: 'Approved', verified: 'Y', verified_by: staff.User_ID },
          { itemId: foundItemIds[7], reportId: lostReportIds[5], userId: students[1].User_ID, status: 'Approved', verified: 'Y', verified_by: staff.User_ID },
          { itemId: foundItemIds[2], reportId: lostReportIds[2], userId: students[2].User_ID, status: 'Pending', verified: null, verified_by: null },
        ];

        for (const claim of claims) {
          await runAsync(`
            INSERT INTO CLAIM (Item_ID,Report_ID,User_ID,Claim_Status,Verified_By_ID,Verification_Date,Acknowledged)
            VALUES (?,?,?,?,?,?,?)
          `, [claim.itemId, claim.reportId, claim.userId, claim.status, claim.verified_by, claim.verified ? '2024-03-01' : null, 'N']);
        }
        console.log(`✅ Inserted ${claims.length} claims`);

        console.log('\n✅ Database seeding completed!\n');
        console.log('📋 Demo Credentials (password for all: Password123!)');
        console.log('  Role    | Username           | Notes');
        console.log('  --------|--------------------|-----------');
        console.log('  Admin   | admin              | Full access');
        console.log('  Staff   | staff1, staff2     | Can verify claims');
        console.log('  Student | juan.delacruz      | Has closed claim');
        console.log('           | maria.santos       | Has closed claim');
        console.log('           | carlo.reyes        | Has pending claim');
        console.log('           | ana.garcia         | No claims yet');
        console.log('           | luis.fernandez     | No claims yet');
        console.log('           | rosa.villalobos    | No claims yet\n');

        console.log('📊 Sample Data:');
        console.log(`  - ${foundItems.length} Found Items (${foundItems.filter(f => f.status === 'Claimed').length} claimed, ${foundItems.filter(f => f.status === 'Unclaimed').length} unclaimed, ${foundItems.filter(f => f.status === 'Matched').length} matched)`);
        console.log(`  - ${lostReports.length} Lost Reports (${lostReports.filter(r => r.status === 'Closed').length} closed, ${lostReports.filter(r => r.status === 'Active').length} active)`);
        console.log(`  - ${matches.length} Matches`);
        console.log(`  - ${claims.length} Claims\n`);

        process.exit(0);
      } catch (err) {
        console.error('❌ Seed error:', err.message);
        process.exit(1);
      }
    });
  });
}

seed();
