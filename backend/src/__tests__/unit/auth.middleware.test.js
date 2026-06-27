const jwt = require('jsonwebtoken');

jest.mock('../../database/init', () => ({
  getAsync: jest.fn(),
}));
const { getAsync } = require('../../database/init');
const { authenticate, authorize } = require('../../middleware/auth.middleware');

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('authenticate middleware', () => {
  beforeEach(() => jest.clearAllMocks());

  test('missing token responds 401', async () => {
    const req = { headers: {} };
    const res = mockRes();
    const next = jest.fn();

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('invalid token responds 401 so the client can re-authenticate', async () => {
    const req = { headers: { authorization: 'Bearer not.a.valid.token' } };
    const res = mockRes();
    const next = jest.fn();

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('expired token responds 401', async () => {
    const token = jwt.sign({ userId: 1 }, process.env.JWT_SECRET, { expiresIn: '-1h' });
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = mockRes();
    const next = jest.fn();

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('valid token for missing/inactive user responds 401', async () => {
    getAsync.mockResolvedValue(undefined);
    const token = jwt.sign({ userId: 99 }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = mockRes();
    const next = jest.fn();

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('valid token for active user attaches req.user and calls next', async () => {
    const user = { User_ID: 1, Role_Type: 'Staff', Is_Active: 'Y' };
    getAsync.mockResolvedValue(user);
    const token = jwt.sign({ userId: 1 }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = mockRes();
    const next = jest.fn();

    await authenticate(req, res, next);

    expect(req.user).toBe(user);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});

describe('authorize middleware', () => {
  test('wrong role responds 403 (authenticated but forbidden)', () => {
    const req = { user: { Role_Type: 'Student' } };
    const res = mockRes();
    const next = jest.fn();

    authorize('Staff', 'Admin')(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  test('allowed role calls next', () => {
    const req = { user: { Role_Type: 'Admin' } };
    const res = mockRes();
    const next = jest.fn();

    authorize('Staff', 'Admin')(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});
