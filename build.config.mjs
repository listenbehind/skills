import { builtinModules } from 'node:module';
import { defineBuildConfig } from 'obuild/config';

// https://github.com/unjs/obuild
// Node SEA embeds a single script: no sibling chunks, no runtime node_modules resolution.
const nodeOnlyExternal = new Set([
  ...builtinModules,
  ...builtinModules.map((m) => `node:${m}`),
]);

export default defineBuildConfig({
  entries: [
    {
      type: 'bundle',
      input: './src/cli.ts',
      // Avoid extra chunks when codeSplitting is off (rolldown + dts quirk).
      dts: false,
    },
  ],
  hooks: {
    rolldownConfig(config) {
      config.external = (id) => nodeOnlyExternal.has(id);
    },
    rolldownOutput(output) {
      output.codeSplitting = false;
    },
  },
});
