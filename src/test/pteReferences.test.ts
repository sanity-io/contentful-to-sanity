import {SanityDocument} from '@sanity/client'
import {DocumentDefinition} from '@sanity/types'
import type {ContentTypeProps} from 'contentful-management'
import {beforeEach, describe, expect, test} from 'vitest'

import {contentfulToDataset} from '../helpers/contentfulToDataset'
import {ArraySanityFieldSchema} from '../types'
import {contentfulTypeToSanitySchema} from '../utils'
import {parse} from './helpers'

declare module 'vitest' {
  export interface TestContext {
    schemas: DocumentDefinition[]
    dataset: SanityDocument[]
  }
}

beforeEach(async (context) => {
  const {default: drafts} = await import('./fixtures/pteReferences.json')
  const {default: published} = await import('./fixtures/pteReferences.published.json')
  const sanityContentTypes = []
  for (const contentType of drafts.contentTypes || []) {
    sanityContentTypes.push(
      contentfulTypeToSanitySchema(contentType as ContentTypeProps, drafts as any, {
        keepMarkdown: true,
      }),
    )
  }
  context.schemas = sanityContentTypes
  context.dataset = (
    await contentfulToDataset(
      {
        drafts: drafts as any,
        published: published as any,
      },
      {
        intlMode: 'single',
        weakRefs: false,
        intlIdStructure: 'delimiter',
        keepMarkdown: false,
        locale: undefined,
      },
    )
  )
    .split('\n')
    .map(parse)
})

describe('PTE block-level references', async () => {
  test('handles unrestricted links', async ({schemas}) => {
    const post = schemas.find((schema) => schema.name === 'post')
    expect(post).toBeDefined()
    const pteField = post?.fields.find((field) => field.name === 'body') as ArraySanityFieldSchema
    expect(pteField).toBeDefined()

    expect(pteField.of).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'reference',
          to: expect.arrayContaining([
            expect.objectContaining({type: 'author'}),
            expect.objectContaining({type: 'post'}),
          ]),
        }),
      ]),
    )
  })

  test('handles links limited to a type', async ({schemas}) => {
    const post = schemas.find((schema) => schema.name === 'post')
    expect(post).toBeDefined()
    const pteField = post?.fields.find((field) => field.name === 'intro') as ArraySanityFieldSchema
    expect(pteField).toBeDefined()

    expect(pteField.of).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'block',
        }),
      ]),
    )

    expect(pteField.of).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'reference',
          to: [{type: 'author'}],
        }),
      ]),
    )
  })
})
