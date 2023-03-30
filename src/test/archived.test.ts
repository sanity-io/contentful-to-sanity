import type {ContentTypeProps} from 'contentful-management'
import {describe, expect, test} from 'vitest'

import {contentfulToDataset} from '../helpers/contentfulToDataset'
import {contentfulToStudioSchema} from '../helpers/contentfulToStudioSchema'
import {contentfulTypeToSanitySchema} from '../utils'
import {parse} from './helpers'

const options = {
  filepath: './fixtures/schema.ts',
  intlMode: 'single',
  keepMarkdown: false,
} as const

describe('Archived content entities', async () => {
  test('generated sanity document types have a hidden contentFulArchived field', async () => {
    const {default: data} = await import('./fixtures/archived.json')

    expect(data.contentTypes.length).toBe(2)

    const sanityContentTypes = []
    for (const contentType of data.contentTypes) {
      sanityContentTypes.push(
        contentfulTypeToSanitySchema(contentType as ContentTypeProps, data as any, {
          keepMarkdown: true,
        }),
      )
    }

    expect(sanityContentTypes.length).toBe(2)

    sanityContentTypes.forEach((doc) => {
      expect(doc.fields).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'contentfulArchived',
            type: 'boolean',
            readOnly: true,
          }),
        ]),
      )
    })
  })

  test('generated document schemas have readOnly function that reads contentfulArchived field, TS', async () => {
    const {default: data} = await import('./fixtures/archived.json')
    expect(
      await contentfulToStudioSchema(data as any, {...options, typescript: true}),
    ).toMatchSnapshot()
  })

  test('generated document schemas have readOnly function that reads contentfulArchived field, JS', async () => {
    const {default: data} = await import('./fixtures/archived.json')
    expect(
      await contentfulToStudioSchema(data as any, {...options, typescript: false}),
    ).toMatchSnapshot()
  })

  test('dataset action sets contentfulArchived field to "true" if the content entity is archived', async () => {
    const {default: drafts} = await import('./fixtures/archived.json')
    const {default: published} = await import('./fixtures/archived.published.json')
    const docs = (
      await contentfulToDataset(
        {drafts: drafts as any, published: published as any},
        {
          locale: 'en-US',
          weakRefs: false,
          intlMode: 'single',
          intlIdStructure: 'delimiter',
          keepMarkdown: true,
        },
      )
    )
      .split('\n')
      .map(parse)

    const archivedPost = docs.find((doc) => doc._id === '2iacrOBkuYMOQyDWPlEJLc')
    expect(archivedPost).toBeDefined()
    expect(archivedPost).toHaveProperty('contentfulArchived', true)
  })
})
