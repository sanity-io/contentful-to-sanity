/// <reference types="vitest" />
/// <reference types="vite/client" />

import tsconfigPaths from 'vite-tsconfig-paths'
import {defineConfig} from 'vitest/config'
import GithubActionsReporter from 'vitest-github-actions-reporter'

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    // eslint-disable-next-line no-undef
    reporters: process.env.GITHUB_ACTIONS ? ['default', new GithubActionsReporter()] : 'default',
  },
})
