const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'test_secret';

// Create test token
function generateTestToken(userId = 1, role = 'Student') {
  return jwt.sign(
    { User_ID: userId, Role_Type: role, Username: `test_user_${userId}` },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
}

// Create test user data
function createTestUser(overrides = {}) {
  return {
    User_ID: 1,
    Person_ID: 1,
    Username: 'testuser',
    Email: 'test@example.com',
    Password_Hash: 'hashed_password',
    Role_Type: 'Student',
    Is_Active: 'Y',
    ...overrides
  };
}

// Create test found item
function createTestItem(overrides = {}) {
  return {
    Item_ID: 1,
    Category_ID: 1,
    Location_ID: 1,
    Item_Name: 'Test Wallet',
    Item_Color: 'Black',
    Item_Brand: 'Coach',
    Date_Found: '2024-01-01',
    Storage_Type: 'Locker',
    Contact_Staff_ID: 1,
    Reported_By_User_ID: 1,
    Item_Status: 'Unclaimed',
    ...overrides
  };
}

// Create test lost report
function createTestReport(overrides = {}) {
  return {
    Report_ID: 1,
    User_ID: 1,
    Category_ID: 1,
    Location_ID: 1,
    Item_Name: 'Test Wallet',
    Item_Color: 'Black',
    Item_Brand: 'Coach',
    Date_Lost: '2024-01-01',
    Contact_Information: '09123456789',
    Report_Status: 'Active',
    ...overrides
  };
}

module.exports = {
  generateTestToken,
  createTestUser,
  createTestItem,
  createTestReport,
  JWT_SECRET
};
