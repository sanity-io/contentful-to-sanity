import {describe, expect, test} from 'vitest'

import {contentfulToDataset} from '../helpers/contentfulToDataset'
import {parse} from './helpers'

describe('Drafts', async () => {
  test('adds drafts from additional export', async () => {
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
    const docs = ndjson.split('\n').map(parse)

    // Check for duplicates in docs array based on _id
    const ids = docs.map((doc) => doc._id)
    expect(ids).toHaveLength(new Set(ids).size)

    // Exists only as drafts
    const draftIds = [`6tQpUjsZ4RyaSzxqNd0Id3`, `9lDgwws6jtn8ow1CkWDmA`]
    for (const id of draftIds) {
      expect(docs.find((doc) => doc._id === `drafts.${id}`)).toBeDefined()
      // Should not be a published document
      expect(docs.filter((doc) => doc._id === id)).toHaveLength(0)
    }

    // Published and draft
    expect(docs.filter((doc) => doc._id === '5NCD8ztIrVWo7MMBf9f81D')).toHaveLength(1)
    expect(docs.find((doc) => doc._id === 'drafts.5NCD8ztIrVWo7MMBf9f81D')).toBeDefined()

    // Published doc with a broken draft ref
    const doc = docs.find((document) => document._id === '6T4f1JKI3KbeqElChsqUZs')
    expect(doc).toBeDefined()
    expect(doc.author).toBeNull()
  })

  test('Draft doc with a draft reference')
})
