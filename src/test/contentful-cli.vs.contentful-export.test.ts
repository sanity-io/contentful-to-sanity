import {expect, test} from 'vitest'

import a from './fixtures/contentful-cli.json'
import b from './fixtures/contentful-export.json'

test('the export made using contentful-cli should match contentful-export', () => {
  expect(a).toStrictEqual(b)
})
