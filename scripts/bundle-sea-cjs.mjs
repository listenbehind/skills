#!/usr/bin/env node
/**
 * One-file CommonJS bundle for Node.js SEA.
 * Node 22 SEA runs the embedded main as CommonJS only; ESM .mjs + import() fails at startup.
 */
import { readFileSync } from 'node:fs';
import { builtinModules } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf-8'));

const nodeBuiltin = new Set([
  ...builtinModules,
  ...builtinModules.map((m) => `node:${m}`),
]);

await esbuild.build({
  absWorkingDir: root,
  entryPoints: [join(root, 'src', 'cli.ts')],
  outfile: join(root, 'dist', 'cli-sea.cjs'),
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node20',
  logLevel: 'info',
  banner: {
    js:
      `globalThis.__SKILLS_EMBEDDED_VERSION__=${JSON.stringify(pkg.version)};\n` +
      `var __esbuild_import_meta_url=require("node:url").pathToFileURL(__filename).href;\n`,
  },
  // ESM sources use import.meta.url; CJS SEA bundle must substitute before bundling.
  define: {
    'import.meta.url': '__esbuild_import_meta_url',
  },
  external: [...nodeBuiltin],
});
