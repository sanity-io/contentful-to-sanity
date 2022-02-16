import globby from 'globby'
import {defineConfig} from 'tsup'

export default defineConfig({
  bundle: true,
  format: ['cjs'],
  entry: [
    './src/index.ts',
    ...globby.sync('./src/commands/*.ts'),
  ],
  splitting: false,
  clean: true,
  noExternal: [
    'configstore',
    'execa',
  ],
})
