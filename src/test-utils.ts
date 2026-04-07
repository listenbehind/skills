import { execFileSync } from 'child_process';
import { join } from 'path';
import { pathToFileURL } from 'url';

const REPO_ROOT = join(import.meta.dirname, '..');
const CLI_PATH = join(import.meta.dirname, 'cli.ts');
/** Absolute file URL so `--import` works when tests set `cwd` to a temp dir (bare `tsx` resolves from cwd). */
const TSX_LOADER = pathToFileURL(join(REPO_ROOT, 'node_modules', 'tsx', 'dist', 'loader.mjs')).href;

/** Run CLI entrypoint via tsx so integration tests work on Node without native .ts execution. */
function execCli(
  args: string[],
  options: {
    cwd?: string;
    env?: NodeJS.ProcessEnv;
    timeout?: number;
    input?: string;
  }
): string {
  const { cwd, env, timeout = 30_000, input } = options;
  return execFileSync(process.execPath, ['--import', TSX_LOADER, CLI_PATH, ...args], {
    encoding: 'utf-8',
    cwd,
    stdio: 'pipe',
    env,
    timeout,
    input,
  });
}

export function stripAnsi(str: string): string {
  return str.replace(/\x1b\[[0-9;]*m/g, '');
}

export function stripLogo(str: string): string {
  return str
    .split('\n')
    .filter((line) => !line.includes('███') && !line.includes('╔') && !line.includes('╚'))
    .join('\n')
    .replace(/^\n+/, '');
}

export function hasLogo(str: string): boolean {
  return str.includes('███') || str.includes('╔') || str.includes('╚');
}

export function runCli(
  args: string[],
  cwd?: string,
  env?: Record<string, string>,
  timeout?: number
): { stdout: string; stderr: string; exitCode: number } {
  try {
    const output = execCli(args, {
      cwd,
      env: env ? { ...process.env, ...env } : undefined,
      timeout: timeout ?? 30_000,
    });
    return { stdout: stripAnsi(output), stderr: '', exitCode: 0 };
  } catch (error: any) {
    return {
      stdout: stripAnsi(error.stdout || ''),
      stderr: stripAnsi(error.stderr || ''),
      exitCode: error.status || 1,
    };
  }
}

export function runCliOutput(args: string[], cwd?: string): string {
  const result = runCli(args, cwd);
  return result.stdout || result.stderr;
}

export function runCliWithInput(
  args: string[],
  input: string,
  cwd?: string
): { stdout: string; stderr: string; exitCode: number } {
  try {
    const output = execCli(args, {
      cwd,
      input: input + '\n',
      timeout: 30_000,
    });
    return { stdout: stripAnsi(output), stderr: '', exitCode: 0 };
  } catch (error: any) {
    return {
      stdout: stripAnsi(error.stdout || ''),
      stderr: stripAnsi(error.stderr || ''),
      exitCode: error.status || 1,
    };
  }
}
