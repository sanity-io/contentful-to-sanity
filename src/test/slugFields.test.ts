import {SanityDocument} from '@sanity/client'
import {DocumentDefinition} from '@sanity/types'
import type {ContentTypeProps} from 'contentful-management'
import type {SlugDefinition} from 'sanity'
import {beforeEach, describe, expect, test} from 'vitest'

import {contentfulToDataset} from '../helpers/contentfulToDataset'
import {contentfulTypeToSanitySchema} from '../utils'
import {parse} from './helpers'

declare module 'vitest' {
  export interface TestContext {
    schemas: DocumentDefinition[]
    dataset: SanityDocument[]
  }
}

beforeEach(async (context) => {
  const {default: drafts} = await import('./fixtures/slugFields.json')
  const {default: published} = await import('./fixtures/slugFields.published.json')
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

describe('Slug fields', async () => {
  test('it preserves source', async ({schemas}) => {
    const doc = schemas[0]
    const map = {
      nameSlug: 'name',
      slug: 'position',
    }
    for (const [name, source] of Object.entries(map)) {
      const slugField = doc.fields.find((field) => field.name === name) as SlugDefinition
      expect(slugField).toBeDefined()
      if (!slugField) return
      expect(slugField.type).toEqual('slug')
      expect(slugField.options?.source).toEqual(source)
    }
  })

  test('it preserves required()', async ({schemas}) => {
    const doc = schemas[0]

    const nameSlugField = doc.fields.find((field) => field.name === 'nameSlug') as SlugDefinition
    expect(nameSlugField).toBeDefined()
    if (!nameSlugField) return
    expect(nameSlugField.type).toEqual('slug')
    expect(nameSlugField.validation).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          flag: 'presence',
          constraint: 'required',
        }),
      ]),
    )

    const slugField = doc.fields.find((field) => field.name === 'slug') as SlugDefinition
    expect(slugField).toBeDefined()
    if (!slugField) return
    expect(slugField.type).toEqual('slug')
    expect(slugField.validation).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          flag: 'presence',
          constraint: 'required',
        }),
      ]),
    )
  })

  test('it preserves maxLength', async ({schemas}) => {
    const doc = schemas[0]
    const slugField = doc.fields.find((field) => field.name === 'slug') as SlugDefinition
    expect(slugField).toBeDefined()
    if (!slugField) return

    expect(slugField.options?.maxLength).toEqual(25)
    expect(slugField.validation).toBeUndefined()
  })
})
