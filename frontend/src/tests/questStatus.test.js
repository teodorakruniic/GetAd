
import { describe, expect, it } from 'vitest';
import { statusNames, submissionStatusNames } from '../questStatus.js';

describe('Quest status names', () => {
  it('translates draft status', () => {
    expect(statusNames.draft).toBe('Osnutek');
  });

  it('translates in_review status', () => {
    expect(statusNames.in_review).toBe('V pregledu');
  });

  it('translates open status', () => {
    expect(statusNames.open).toBe('Odprt');
  });

  it('translates judging status', () => {
    expect(statusNames.judging).toBe('Izbor zmagovalca');
  });

  it('contains all five quest statuses', () => {
    expect(Object.keys(statusNames)).toHaveLength(5);
  });
});

describe('Submission status names', () => {
  it('translates approved status', () => {
    expect(submissionStatusNames.approved).toBe('Odobrena');
  });

  it('translates rejected status', () => {
    expect(submissionStatusNames.rejected).toBe('Zavrnjena');
  });
});
