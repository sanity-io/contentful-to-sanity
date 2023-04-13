import type {
  ArrayDefinition,
  DocumentDefinition,
  ReferenceDefinition,
  SanityDocument,
} from '@sanity/types'
import type {ContentTypeProps} from 'contentful-management'
import {BlockDefinition} from 'sanity'
import {beforeEach, describe, expect, test} from 'vitest'

import {contentfulToDataset} from '../helpers/contentfulToDataset'
import {coreTypes} from '../helpers/sanity/reservedNames'
import type {ContentfulExport} from '../types'
import {contentfulTypeToSanitySchema} from '../utils'
import {
  contentfulContentTypeFactory,
  contentfulEditorControlFactory,
  contentfulEditorInterfaceFactory,
  parse,
} from './helpers'

interface LocalTestContext {
  schemas: DocumentDefinition[]
  dataset: SanityDocument[]
  rawDataset: string[]
}

const schemaWithContentfulName = (name: string) => {
  const contentType = contentfulContentTypeFactory(
    name,
    [
      {
        id: 'title',
        name: 'title',
        type: 'Symbol',
        localized: false,
        required: false,
      },
    ],
    'title',
  )

  const data: ContentfulExport = {
    editorInterfaces: [
      contentfulEditorInterfaceFactory(name, [
        contentfulEditorControlFactory('title', 'singleLine'),
      ]),
    ],
    contentTypes: [contentType],
  }

  return contentfulTypeToSanitySchema(contentType, data, {keepMarkdown: false})
}

beforeEach<LocalTestContext>(async (context) => {
  const {default: drafts} = await import('./fixtures/reservedNames.json')
  const {default: published} = await import('./fixtures/reservedNames.published.json')
  const sanityContentTypes = []
  for (const contentType of drafts.contentTypes || []) {
    sanityContentTypes.push(
      contentfulTypeToSanitySchema(contentType as ContentTypeProps, drafts as any, {
        keepMarkdown: true,
      }),
    )
  }
  context.schemas = sanityContentTypes
  context.rawDataset = (
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
  ).split('\n')
  context.dataset = context.rawDataset.map(parse)
})

describe('Reserved schema type names', () => {
  describe('schema', () => {
    test('reserved names are rewritten to avoid collisions with core types', () => {
      expect(coreTypes.length).toBeGreaterThan(0)
      coreTypes.forEach((type) => {
        const schema = schemaWithContentfulName(type.name)
        expect(schema.name).toBe(`contentful_${type.name}`)
      })
    })

    test('reserved names are rewritten to avoid collisions with system types', () => {
      const systemTypes = ['system.group', 'sanity.imageAsset', 'sanity.fileAsset']
      systemTypes.forEach((typeName) => {
        const schema = schemaWithContentfulName(typeName)
        expect(schema.name).toBe(`contentful_${typeName}`)
      })
    })

    test('reserved names are rewritten in reference', ({schemas}) => {
      const articleSchema = schemas.find((schema) => schema.name === 'article')
      expect(articleSchema).toBeDefined()
      if (!articleSchema) return

      const imageRef = articleSchema.fields.find(
        (field) => field.name === 'imageRef',
      ) as ReferenceDefinition
      expect(imageRef).toBeDefined()
      if (!imageRef) return

      expect(imageRef.to).toEqual([{type: 'contentful_image'}])
    })

    test('reserved names are rewritten in arrays of references', ({schemas}) => {
      const articleSchema = schemas.find((schema) => schema.name === 'article')
      expect(articleSchema).toBeDefined()
      if (!articleSchema) return

      const refs = articleSchema.fields.find(
        (field) => field.name === 'manyAnyRef',
      ) as ArrayDefinition
      expect(refs).toBeDefined()
      if (!refs) return

      expect(refs.of).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'reference',
            to: expect.arrayContaining([
              expect.objectContaining({type: 'contentful_image'}),
              expect.objectContaining({type: 'contentful_object'}),
            ]),
          }),
        ]),
      )
    })

    test('reserved names are rewritten in portable text schema', ({schemas}) => {
      const articleSchema = schemas.find((schema) => schema.name === 'article')
      expect(articleSchema).toBeDefined()
      if (!articleSchema) return

      const pt = articleSchema.fields.find((field) => field.name === 'richText') as ArrayDefinition
      expect(pt).toBeDefined()
      if (!pt) return

      const blockRef = pt.of.find((field) => field.type === 'reference') as ReferenceDefinition
      expect(blockRef).toBeDefined()
      if (!blockRef) return

      expect(blockRef.to).toEqual(
        expect.arrayContaining([
          expect.objectContaining({type: 'contentful_image'}),
          expect.objectContaining({type: 'contentful_object'}),
        ]),
      )

      const blockDef = pt.of.find((field) => field.type === 'block') as BlockDefinition
      expect(blockDef).toBeDefined()
      if (!blockDef) return

      expect(blockDef.of).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'reference',
            to: expect.arrayContaining([
              expect.objectContaining({type: 'contentful_image'}),
              expect.objectContaining({type: 'contentful_object'}),
            ]),
          }),
        ]),
      )

      expect(blockDef.marks?.annotations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'reference',
            to: expect.arrayContaining([
              expect.objectContaining({type: 'contentful_image'}),
              expect.objectContaining({type: 'contentful_object'}),
            ]),
          }),
        ]),
      )
    })
  })

  describe('dataset', () => {
    test('reserved names are rewritten in documents', ({dataset}) => {
      const image = dataset.find((document) => document._id === 'bDU8kBl0185ZBJaDA1ZVb')
      expect(image).toBeDefined()
      expect(image?._type).toBe('contentful_image')

      const object = dataset.find((document) => document._id === '1Kxbt7Dl0M1BUm66eg2tw2')
      expect(object).toBeDefined()
      expect(object?._type).toBe('contentful_object')
    })
  })
})
