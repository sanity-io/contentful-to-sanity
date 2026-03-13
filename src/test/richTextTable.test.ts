import {SanityDocument} from '@sanity/client'
import {PortableTextTextBlock} from '@sanity/types'
import {describe, expect, test, vi} from 'vitest'

import {contentfulToDataset} from '../helpers/contentfulToDataset'
import {parse} from './helpers'

const datasetOptions = {
  intlMode: 'single' as const,
  weakRefs: false,
  intlIdStructure: 'delimiter' as const,
  keepMarkdown: false,
  locale: undefined,
}

describe('Rich text table nodes', () => {
  test('dataset generation does not throw when rich text contains table nodes', async () => {
    const {default: drafts} = await import('./fixtures/richTextTable.json')
    const {default: published} = await import('./fixtures/richTextTable.published.json')

    await expect(
      contentfulToDataset({drafts: drafts as any, published: published as any}, datasetOptions),
    ).resolves.not.toThrow()
  })

  test('table nodes are skipped and surrounding content is preserved', async () => {
    const {default: drafts} = await import('./fixtures/richTextTable.json')
    const {default: published} = await import('./fixtures/richTextTable.published.json')

    const raw = await contentfulToDataset(
      {drafts: drafts as any, published: published as any},
      datasetOptions,
    )

    const docs: SanityDocument[] = raw.split('\n').map(parse)
    const published_doc = docs.find((d) => d._id === 'entry1')
    expect(published_doc).toBeDefined()

    const body = published_doc!.body as PortableTextTextBlock[]
    // Table node is skipped; only the two surrounding paragraphs should remain
    expect(body).toHaveLength(2)
    expect(body[0].children[0].text).toBe('Before table')
    expect(body[1].children[0].text).toBe('After table')
  })

  test('warning includes entry ID, content type, and field name', async () => {
    const {default: drafts} = await import('./fixtures/richTextTable.json')
    const {default: published} = await import('./fixtures/richTextTable.published.json')

    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    await contentfulToDataset({drafts: drafts as any, published: published as any}, datasetOptions)

    expect(warn).toHaveBeenCalledWith(expect.stringContaining('entry1'))
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('post'))
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('body'))
    warn.mockRestore()
  })
})
