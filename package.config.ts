import {defineConfig} from '@sanity/pkg-utils'

export default defineConfig({
  tsconfig: 'tsconfig.dist.json',

  extract: {
    rules: {
      'ae-missing-release-tag': 'off',
      // 'ae-forgotten-export': 'warn',
      // @TODO until TS errors are fixed
      'ae-forgotten-export': 'off',
      'ae-incompatible-release-tags': 'off',
      'ae-internal-missing-underscore': 'off',
      'tsdoc-link-tag-unescaped-text': 'off',
      'tsdoc-undefined-tag': 'off',
      'tsdoc-unsupported-tag': 'off',
    },
  },
})
