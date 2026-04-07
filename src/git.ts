import simpleGit from 'simple-git';
import { join, normalize, resolve, sep } from 'path';
import { mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';

/** Default git operation block timeout (slow networks / large repos). */
const DEFAULT_CLONE_TIMEOUT_MS = 300_000; // 5 minutes

const MIN_CLONE_TIMEOUT_MS = 5_000;
const MAX_CLONE_TIMEOUT_MS = 1_800_000; // 30 minutes

export function resolveCloneTimeoutMs(): number {
  const raw = process.env.SKILLS_GIT_CLONE_TIMEOUT_MS?.trim();
  if (raw) {
    const parsed = Number.parseInt(raw, 10);
    if (
      Number.isFinite(parsed) &&
      parsed >= MIN_CLONE_TIMEOUT_MS &&
      parsed <= MAX_CLONE_TIMEOUT_MS
    ) {
      return parsed;
    }
  }
  return DEFAULT_CLONE_TIMEOUT_MS;
}

export class GitCloneError extends Error {
  readonly url: string;
  readonly isTimeout: boolean;
  readonly isAuthError: boolean;

  constructor(message: string, url: string, isTimeout = false, isAuthError = false) {
    super(message);
    this.name = 'GitCloneError';
    this.url = url;
    this.isTimeout = isTimeout;
    this.isAuthError = isAuthError;
  }
}

function cloneLogDisabled(): boolean {
  return process.env.SKILLS_GIT_CLONE_LOG === '0' || process.env.SKILLS_GIT_CLONE_LOG === 'false';
}

function logClonePhase(message: string): void {
  if (cloneLogDisabled()) return;
  console.error(`skills: ${message}`);
}

export async function cloneRepo(url: string, ref?: string): Promise<string> {
  const tempDir = await mkdtemp(join(tmpdir(), 'skills-'));
  const cloneTimeoutMs = resolveCloneTimeoutMs();
  const git = simpleGit({
    timeout: { block: cloneTimeoutMs },
    env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
  });
  const cloneOptions: string[] = [...(ref ? ['--depth', '1', '--branch', ref] : ['--depth', '1'])];
  if (
    process.env.SKILLS_GIT_CLONE_PROGRESS === '1' ||
    process.env.SKILLS_GIT_CLONE_PROGRESS === 'true'
  ) {
    cloneOptions.push('--progress');
  }

  const refLabel = ref ? ` @ ${ref}` : '';
  const timeoutSec = Math.round(cloneTimeoutMs / 1000);
  logClonePhase(
    `git clone starting — ${url}${refLabel} → ${tempDir} (block timeout ${timeoutSec}s; set SKILLS_GIT_CLONE_PROGRESS=1 for receive/progress lines)`
  );

  try {
    await git.clone(url, tempDir, cloneOptions);
    logClonePhase(`git clone finished — ${tempDir}`);
    return tempDir;
  } catch (error) {
    // Clean up temp dir on failure
    await rm(tempDir, { recursive: true, force: true }).catch(() => {});

    const errorMessage = error instanceof Error ? error.message : String(error);
    const isTimeout = errorMessage.includes('block timeout') || errorMessage.includes('timed out');
    const isAuthError =
      errorMessage.includes('Authentication failed') ||
      errorMessage.includes('could not read Username') ||
      errorMessage.includes('Permission denied') ||
      errorMessage.includes('Repository not found');

    if (isTimeout) {
      const sec = Math.round(cloneTimeoutMs / 1000);
      throw new GitCloneError(
        `Clone timed out after ${sec}s (limit: SKILLS_GIT_CLONE_TIMEOUT_MS, default ${DEFAULT_CLONE_TIMEOUT_MS / 1000}s). ` +
          `Slow links and large repos may need a higher value.\n` +
          `  This also happens with private repos that require authentication — ensure you have access:\n` +
          `  - For SSH: ssh-add -l (to check loaded keys)\n` +
          `  - For HTTPS: gh auth status (if using GitHub CLI)`,
        url,
        true,
        false
      );
    }

    if (isAuthError) {
      throw new GitCloneError(
        `Authentication failed for ${url}.\n` +
          `  - For private repos, ensure you have access\n` +
          `  - For SSH: Check your keys with 'ssh -T git@github.com'\n` +
          `  - For HTTPS: Run 'gh auth login' or configure git credentials`,
        url,
        false,
        true
      );
    }

    if (!cloneLogDisabled()) {
      console.error(
        `skills: git clone failed — ${url}${refLabel} (${errorMessage.split('\n')[0]})`
      );
    }
    throw new GitCloneError(`Failed to clone ${url}: ${errorMessage}`, url, false, false);
  }
}

export async function cleanupTempDir(dir: string): Promise<void> {
  // Validate that the directory path is within tmpdir to prevent deletion of arbitrary paths
  const normalizedDir = normalize(resolve(dir));
  const normalizedTmpDir = normalize(resolve(tmpdir()));

  if (!normalizedDir.startsWith(normalizedTmpDir + sep) && normalizedDir !== normalizedTmpDir) {
    throw new Error('Attempted to clean up directory outside of temp directory');
  }

  await rm(dir, { recursive: true, force: true });
}
