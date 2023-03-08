import {defineConfig} from '@sanity/pkg-utils'

export default defineConfig({
  extract: {
    rules: {
      'ae-missing-release-tag': 'off',
      'ae-forgotten-export': 'warn',
    },
  },
})
