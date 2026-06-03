const jwt = require('jsonwebtoken');
const { generateTestToken, JWT_SECRET } = require('../helpers');

describe('JWT Authentication', () => {
  test('should generate valid token', () => {
    const token = generateTestToken(1, 'Student');
    expect(token).toBeTruthy();

    const decoded = jwt.verify(token, JWT_SECRET);
    expect(decoded.User_ID).toBe(1);
    expect(decoded.Role_Type).toBe('Student');
  });

  test('should decode token correctly', () => {
    const token = generateTestToken(5, 'Admin');
    const decoded = jwt.verify(token, JWT_SECRET);

    expect(decoded).toHaveProperty('User_ID', 5);
    expect(decoded).toHaveProperty('Role_Type', 'Admin');
  });

  test('should reject invalid token', () => {
    const invalidToken = 'invalid.token.here';
    expect(() => {
      jwt.verify(invalidToken, JWT_SECRET);
    }).toThrow();
  });

  test('should reject expired token', () => {
    const expiredToken = jwt.sign(
      { User_ID: 1, Role_Type: 'Student' },
      JWT_SECRET,
      { expiresIn: '-1h' }
    );

    expect(() => {
      jwt.verify(expiredToken, JWT_SECRET);
    }).toThrow();
  });
});
