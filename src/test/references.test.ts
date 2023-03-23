import {describe, expect, test} from 'vitest'

import {contentfulToDataset} from '../helpers/contentfulToDataset'
import {parse} from './helpers'

describe('Reference fields', async () => {
  test('avoids creating broken _ref', async () => {
    const {default: data} = await import('./fixtures/brokenRefs.json')

    const options = {
      intlMode: 'single',
      weakRefs: false,
      intlIdStructure: 'delimiter',
      keepMarkdown: false,
      locale: undefined,
    } as const

    const res = (await contentfulToDataset({drafts: data as any, published: data as any}, options)).split('\n').map(parse)
    // 1ulybB3BSdHCNQe2UCWbX5 is the id of a post with a broken `author` link
    const post = res.find((e) => e._id === '1ulybB3BSdHCNQe2UCWbX5')
    expect(post).toBeDefined()
    // NOTE: I would have liked to set this to _weak: true and preserve the
    // intention of a reference, but the import step would attempt to strengthen
    // this _ref according to the schema and that would fail. So the best we can
    // do is omit broken ref data and report about it on console.
    expect(post.author).toBeNull()
  })
})
