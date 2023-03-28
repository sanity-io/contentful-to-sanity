/// <reference types="vitest" />
/// <reference types="vite/client" />

// https://github.com/vitest-dev/vitest/issues/740
// We need to import sharp here to avoid the test runner crashing.
// Likely because it is trying to initialize sharp in worker threads,
// and this is the only location where we are not in a worker thread.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import sharp from 'sharp'
import {defineConfig} from 'vitest/config'
import GithubActionsReporter from 'vitest-github-actions-reporter'

export default defineConfig({
  test: {
    reporters: process.env.GITHUB_ACTIONS ? ['default', new GithubActionsReporter()] : 'default',
  },
})
