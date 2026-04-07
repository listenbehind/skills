import { afterEach, describe, expect, it } from 'vitest';
import { resolveCloneTimeoutMs } from './git.ts';

describe('resolveCloneTimeoutMs', () => {
  const original = process.env.SKILLS_GIT_CLONE_TIMEOUT_MS;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.SKILLS_GIT_CLONE_TIMEOUT_MS;
    } else {
      process.env.SKILLS_GIT_CLONE_TIMEOUT_MS = original;
    }
  });

  it('defaults to 5 minutes when unset', () => {
    delete process.env.SKILLS_GIT_CLONE_TIMEOUT_MS;
    expect(resolveCloneTimeoutMs()).toBe(300_000);
  });

  it('reads SKILLS_GIT_CLONE_TIMEOUT_MS when valid', () => {
    process.env.SKILLS_GIT_CLONE_TIMEOUT_MS = '120000';
    expect(resolveCloneTimeoutMs()).toBe(120_000);
  });

  it('ignores values below minimum', () => {
    process.env.SKILLS_GIT_CLONE_TIMEOUT_MS = '1000';
    expect(resolveCloneTimeoutMs()).toBe(300_000);
  });

  it('ignores values above maximum', () => {
    process.env.SKILLS_GIT_CLONE_TIMEOUT_MS = '999999999';
    expect(resolveCloneTimeoutMs()).toBe(300_000);
  });

  it('ignores non-numeric values', () => {
    process.env.SKILLS_GIT_CLONE_TIMEOUT_MS = 'abc';
    expect(resolveCloneTimeoutMs()).toBe(300_000);
  });
});
