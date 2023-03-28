import {describe, expect, test} from 'vitest'

import {contentfulAssetUrlToContentType} from './contentfulAssetUrlToContentType'

describe('convertUnsupportedImages', () => {
  test('parses content type from export', async () => {
    const {default: data} = await import('../test/fixtures/drafts.json')

    const tests = {
      '//images.ctfassets.net/6cvippge3sd1/4S9vZQAr0k7gS37zi7iNDG/c3c715c652fd3a26f94a032e1a06cf9a/image.png':
        'image/png',
      'https://images.ctfassets.net/6cvippge3sd1/4S9vZQAr0k7gS37zi7iNDG/c3c715c652fd3a26f94a032e1a06cf9a/image.png':
        'image/png',
      'unknown.avif': 'image/avif',
      '': undefined,
    }

    for (const [url, expected] of Object.entries(tests)) {
      expect(contentfulAssetUrlToContentType(url, data.assets, 'en-US')).toBe(expected)
    }
  })
})
