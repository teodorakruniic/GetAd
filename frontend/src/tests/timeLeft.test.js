
import { describe, expect, it, vi, afterEach } from 'vitest';
import { timeLeft } from '../timeLeft.js';

afterEach(() => {
  vi.useRealTimers();
});

describe('Time left until deadline', () => {
  it('returns expired message for past deadline', () => {
    vi.setSystemTime(new Date('2026-11-21T12:00:00Z'));
    expect(timeLeft('2026-11-20T12:00:00Z')).toBe('rok je potekel');
  });

  it('calculates days and hours correctly', () => {
    vi.setSystemTime(new Date('2026-11-21T12:00:00Z'));
    expect(timeLeft('2026-11-24T17:00:00Z')).toBe('3 d 5 h');
  });

  it('returns zero days for a deadline within 24 hours', () => {
    vi.setSystemTime(new Date('2026-11-21T12:00:00Z'));
    expect(timeLeft('2026-11-21T18:00:00Z')).toBe('0 d 6 h');
  });
});
