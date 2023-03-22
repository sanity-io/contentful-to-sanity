import {describe, expect, test} from 'vitest'

import {contentfulToDataset} from '../helpers/contentfulToDataset'
import {parse} from './helpers'

describe('Drafts', async () => {
  test('adds drafts from additional export', async () => {
    const {default: data} = await import('./fixtures/drafts.json')
    const options = {
      intlMode: 'single',
      weakRefs: false,
      intlIdStructure: 'delimiter',
      keepMarkdown: false,
      locale: undefined,
    } as const

    const ndjson = await contentfulToDataset(data as any, options)
    const docs = ndjson.split('\n').map(parse)

    // Exists only as drafts
    expect(docs.find((doc) => doc._id === 'drafts.6tQpUjsZ4RyaSzxqNd0Id3')).toBeDefined()
    expect(docs.find((doc) => doc._id === 'drafts.9lDgwws6jtn8ow1CkWDmA')).toBeDefined()

    // Published and draft
    const publishedWithDraft = docs.find((doc) => doc._id === '5NCD8ztIrVWo7MMBf9f81D')
    expect(publishedWithDraft).toBeDefined()
    expect(publishedWithDraft).to.contain({
      _type: 'post',
    })
    expect(docs.find((doc) => doc._id === 'drafts.5NCD8ztIrVWo7MMBf9f81D')).toBeDefined()

    // Published doc with a broken draft ref
    const doc = docs.find((doc) => doc._id === '6T4f1JKI3KbeqElChsqUZs')
    expect(doc).toBeDefined()
    expect(doc).to.contain({
      _type: 'post',
      author: {
        _type: 'reference',
        _ref: '9lDgwws6jtn8ow1CkWDmA',
      },
    })
  })
})
