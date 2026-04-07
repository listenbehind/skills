#!/usr/bin/env node
/**
 * Build a Node.js Single Executable Application (SEA) using the official workflow:
 * blob via --experimental-sea-config, copy node binary, postject inject.
 * @see https://nodejs.org/api/single-executable-applications.html
 *
 * Prerequisites: pnpm build (dist/cli.mjs). Requires Node 20+.
 *
 * Env:
 *   SEA_OUTPUT_NAME  Final filename under build/sea/ (e.g. skills-linux-amd64 or skills-windows-amd64.exe)
 */
import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, writeFileSync, unlinkSync, existsSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const seaDir = join(root, 'build', 'sea');

const outName = process.env.SEA_OUTPUT_NAME;
if (!outName) {
  console.error('Set SEA_OUTPUT_NAME, e.g. skills-linux-amd64 or skills-windows-amd64.exe');
  process.exit(1);
}

const [maj] = process.versions.node.split('.').map(Number);
if (maj < 20) {
  console.error('Node 20+ is required to generate SEA blobs. Current:', process.version);
  process.exit(1);
}

const mainJs = join(root, 'dist', 'cli-sea.cjs');
if (!existsSync(mainJs)) {
  console.error('Missing dist/cli-sea.cjs — run: node scripts/bundle-sea-cjs.mjs (or pnpm build:sea)');
  process.exit(1);
}

mkdirSync(seaDir, { recursive: true });
const blobPath = join(seaDir, 'sea-prep.blob');
const outPath = join(seaDir, outName);
const configPath = join(seaDir, 'sea-config.json');
const postjectCli = join(root, 'node_modules', 'postject', 'dist', 'cli.js');
if (!existsSync(postjectCli)) {
  console.error('Missing postject — run pnpm install');
  process.exit(1);
}

// Node 22 SEA executes the embedded script as CommonJS only (see Node 22 docs). Use cli-sea.cjs.
const config = {
  main: resolve(mainJs),
  output: resolve(blobPath),
  disableExperimentalSEAWarning: true,
  useCodeCache: false,
};
writeFileSync(configPath, JSON.stringify(config, null, 2));

let r = spawnSync(process.execPath, ['--experimental-sea-config', configPath], {
  cwd: root,
  stdio: 'inherit',
});
if (r.status !== 0) process.exit(r.status ?? 1);

copyFileSync(process.execPath, outPath);

const platform = process.platform;
if (platform === 'darwin') {
  r = spawnSync('codesign', ['--remove-signature', outPath], { stdio: 'inherit' });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

const pjArgs = [
  postjectCli,
  outPath,
  'NODE_SEA_BLOB',
  blobPath,
  '--sentinel-fuse',
  'NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2',
];
if (platform === 'darwin') {
  pjArgs.push('--macho-segment-name', 'NODE_SEA');
}

r = spawnSync(process.execPath, pjArgs, { cwd: root, stdio: 'inherit' });
if (r.status !== 0) process.exit(r.status ?? 1);

if (platform === 'darwin') {
  r = spawnSync('codesign', ['--sign', '-', '--force', outPath], { stdio: 'inherit' });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

if (platform !== 'win32') {
  spawnSync('chmod', ['0755', outPath], { stdio: 'inherit' });
}

try {
  unlinkSync(blobPath);
} catch {
  // ignore
}

console.log('SEA binary:', outPath);
console.log('Size (bytes):', statSync(outPath).size);
