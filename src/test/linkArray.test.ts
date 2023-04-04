import {SanityDocument, SanityReference} from '@sanity/client'
import {DocumentDefinition, SanityDocumentLike} from '@sanity/types'
import type {ContentTypeProps} from 'contentful-management'
import {beforeEach, describe, expect, test} from 'vitest'

import {contentfulToDataset} from '../helpers/contentfulToDataset'
import {ArraySanityFieldSchema, ReferenceSanityFieldSchema} from '../types'
import {contentfulTypeToSanitySchema} from '../utils'
import {parse} from './helpers'

declare module 'vitest' {
  export interface TestContext {
    schemas: DocumentDefinition[]
    dataset: SanityDocument[]
  }
}

beforeEach(async (context) => {
  const {default: drafts} = await import('./fixtures/linkArray.json')
  const {default: published} = await import('./fixtures/linkArray.published.json')
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

describe('Array of links', async () => {
  test('it declares array of references to only author', async ({schemas}) => {
    const doc = schemas[0]
    const authorsField = doc.fields.find((field) => field.name === 'authors')
    expect(authorsField).toBeDefined()
    if (!authorsField) return
    expect(authorsField.type).toEqual('array')
    const authorField = (authorsField as ArraySanityFieldSchema).of.find(
      (field) => field.type === 'reference',
    )
    expect(authorField).toBeDefined()
    expect((authorField as ReferenceSanityFieldSchema)?.to).toEqual([{type: 'author'}])
  })

  test('it creates strong references to author', async ({dataset}) => {
    const post = dataset.find((doc) => doc._type === 'post')
    expect(post).toBeDefined()
    if (!post) return
    expect(post.authors.length).toBe(2)
    post.authors.forEach((author: Record<string, any>) => {
      expect(author._ref).toBeDefined()
      expect(author._weak).toBeFalsy()
    })
  })
})
