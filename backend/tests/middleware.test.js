
import { beforeEach, describe, expect, it, vi } from 'vitest';
import jwt from 'jsonwebtoken';

vi.mock('../src/db.js', () => ({
  default: {
    user: {
      findUnique: vi.fn(),
    },
    quest: {
      updateMany: vi.fn(),
    },
  },
}));

import prisma from '../src/db.js';
import { requireAuth } from '../src/middleware/auth.js';
import { closeExpiredQuests } from '../src/middleware/closeExpired.js';

const JWT_SECRET = 'test-secret';

function createResponse() {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    clearCookie: vi.fn(),
  };
  return res;
}

function createRequest(token) {
  return { cookies: token ? { token } : {} };
}

function createToken(id = 'user-1') {
  return jwt.sign({ id }, JWT_SECRET);
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.JWT_SECRET = JWT_SECRET;
});

describe('Authentication middleware', () => {
  it('rejects requests without a token', async () => {
    const req = createRequest();
    const res = createResponse();
    const next = vi.fn();

    await requireAuth()(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects an invalid token', async () => {
    const req = createRequest('invalid-token');
    const res = createResponse();
    const next = vi.fn();

    await requireAuth()(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects a user that does not exist', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    const req = createRequest(createToken());
    const res = createResponse();
    const next = vi.fn();

    await requireAuth()(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.clearCookie).toHaveBeenCalledWith('token');
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects a blocked user', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      role: 'creator',
      is_blocked: true,
    });

    const req = createRequest(createToken());
    const res = createResponse();
    const next = vi.fn();

    await requireAuth()(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects a user without the required role', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      role: 'creator',
      is_blocked: false,
    });

    const req = createRequest(createToken());
    const res = createResponse();
    const next = vi.fn();

    await requireAuth('admin')(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('allows a user with the required role', async () => {
    const user = {
      id: 'user-1',
      role: 'admin',
      is_blocked: false,
    };

    prisma.user.findUnique.mockResolvedValue(user);

    const req = createRequest(createToken());
    const res = createResponse();
    const next = vi.fn();

    await requireAuth('admin')(req, res, next);

    expect(req.user).toEqual(user);
    expect(next).toHaveBeenCalledOnce();
  });

  it('allows an authenticated user when no role is required', async () => {
    const user = {
      id: 'user-1',
      role: 'creator',
      is_blocked: false,
    };

    prisma.user.findUnique.mockResolvedValue(user);

    const req = createRequest(createToken());
    const res = createResponse();
    const next = vi.fn();

    await requireAuth()(req, res, next);

    expect(next).toHaveBeenCalledOnce();
  });
});

describe('Expired quest middleware', () => {
  it('moves expired open quests to judging status', async () => {
    const next = vi.fn();

    await closeExpiredQuests({}, {}, next);

    expect(prisma.quest.updateMany).toHaveBeenCalledOnce();

    const query = prisma.quest.updateMany.mock.calls[0][0];

    expect(query.where.status).toBe('open');
    expect(query.where.deadline.lt).toBeInstanceOf(Date);
    expect(query.data.status).toBe('judging');
    expect(next).toHaveBeenCalledOnce();
  });
});
