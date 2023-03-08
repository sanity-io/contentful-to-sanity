import {defineConfig} from '@sanity/pkg-utils'

// ESM only packages and the like, that needs to be transpiled
const noExternal = new Set(['valid-filename'])

export default defineConfig({
  tsconfig: 'tsconfig.dist.json',

  external: (externals) => externals.filter((external) => !noExternal.has(external)),

  extract: {
    rules: {
      'ae-missing-release-tag': 'off',
      'ae-forgotten-export': 'warn',
    },
  },
})
