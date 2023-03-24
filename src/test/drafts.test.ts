import {SanityDocument} from '@sanity/client'
import {beforeEach, describe, expect, test} from 'vitest'

import {contentfulToDataset} from '../helpers/contentfulToDataset'
import {parse} from './helpers'

declare module 'vitest' {
  export interface TestContext {
    docs: SanityDocument[]
  }
}

beforeEach(async (context) => {
  const {default: drafts} = await import('./fixtures/drafts.json')
  const {default: published} = await import('./fixtures/drafts.published.json')
  const options = {
    intlMode: 'single',
    weakRefs: false,
    intlIdStructure: 'delimiter',
    keepMarkdown: false,
    locale: undefined,
  } as const

  const ndjson = await contentfulToDataset(
    {
      drafts: drafts as any,
      published: published as any,
    },
    options,
  )
  context.docs = ndjson.split('\n').map(parse)
})

describe('Drafts', async () => {
  test('Draft doc with a draft reference', async ({docs}) => {
    const post = docs.find((doc) => doc._id === 'drafts.4RIfygf1stLd0J1gycYXlu')
    expect(post).toBeDefined()
    const person = docs.find((doc) => doc._id === 'drafts.6PRft3TsWQAf2Fkeb6ZKhb')
    expect(person).toBeDefined()

    expect(post?.author).toEqual({
      _ref: person?._id,
      _type: 'reference',
      _weak: true,
      _strengthenOnPublish: {
        type: 'person',
        template: {
          id: 'person',
          params: {},
        },
      },
    })
  })
  test('Published post with a broken ref to a draft', async ({docs}) => {
    const post = docs.find((doc) => doc._id === '5675910SUMh7sD0qbhvdp2')
    expect(post).toBeDefined()
    expect(post?.author).toBeNull()

    // Also this post should not have a draft
    expect(docs.find((doc) => doc._id === 'draft.5675910SUMh7sD0qbhvdp2')).toBeUndefined()
  })
})
