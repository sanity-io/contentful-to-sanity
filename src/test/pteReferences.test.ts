import {SanityDocument} from '@sanity/client'
import {BlockDefinition, DocumentDefinition} from '@sanity/types'
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
  describe('schema', async () => {
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
      const pteField = post?.fields.find(
        (field) => field.name === 'intro',
      ) as ArraySanityFieldSchema
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

  describe('dataset', async () => {
    test('creates reference from embedded entries', async ({dataset}) => {
      const post = dataset.find(
        (doc) => doc._type === 'post' && doc._id === 'drafts.1B48wTtOpUhuuEoNkTDji2',
      )
      expect(post).toBeDefined()
      if (!post) return

      // Should link to a specific author
      expect(post.body[3]).toHaveProperty('_type', 'reference')
      expect(post.body[3]).toHaveProperty('_ref', '5JpJ63LfU5itcEFXvgpA4Z')

      // Should link to a specific draft author
      expect(post.body[5]).toHaveProperty('_type', 'reference')
      expect(post.body[5]).toHaveProperty('_strengthenOnPublish')
      expect(post.body[5]).toHaveProperty('_ref', 'drafts.wLhL9uUiZUHRC28p9Ix8E')
    })
  })
})

describe('PTE inline embed references', async () => {
  describe('schema', async () => {
    test('handles unrestricted inline level references', async ({schemas}) => {
      const post = schemas.find((schema) => schema.name === 'post')
      const pteField = post?.fields.find((field) => field.name === 'body') as ArraySanityFieldSchema
      expect(pteField.of).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'block',
            of: expect.arrayContaining([
              expect.objectContaining({
                type: 'reference',
                to: expect.arrayContaining([
                  expect.objectContaining({type: 'author'}),
                  expect.objectContaining({type: 'post'}),
                ]),
              }),
            ]),
          }),
        ]),
      )
    })

    test('handles type limited inline level references', async ({schemas}) => {
      const post = schemas.find((schema) => schema.name === 'post')
      const pteField = post?.fields.find(
        (field) => field.name === 'intro',
      ) as ArraySanityFieldSchema
      const block = pteField.of.find((field) => field.type === 'block') as BlockDefinition
      expect(block).toBeDefined()
      expect(block.of).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'reference',
            to: [{type: 'author'}], // Just author
          }),
        ]),
      )
    })
  })
  describe('dataset', async () => {
    test('creates inline reference from inlined entry', async ({dataset}) => {
      const post = dataset.find(
        (doc) => doc._type === 'post' && doc._id === 'drafts.1B48wTtOpUhuuEoNkTDji2',
      )
      expect(post).toBeDefined()
      if (!post) return

      // Should link to a specific author in the middle of the block
      const block = post.body[1]
      expect(block.children).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            _type: 'reference',
            _ref: '152iqA9FIQSu7kccv6uGcu',
          }),
        ]),
      )
    })
  })
})

describe('PTE annotation embed references', async () => {
  test('unrestricted embeds to any type', async ({schemas}) => {
    const post = schemas.find((schema) => schema.name === 'post')
    const pteField = post?.fields.find((field) => field.name === 'body') as ArraySanityFieldSchema
    const blockType = pteField.of.find((field) => field.type === 'block') as BlockDefinition

    expect(blockType.marks?.annotations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'object',
          name: 'internalLink',
          title: 'Internal link',
          fields: expect.arrayContaining([
            expect.objectContaining({
              type: 'reference',
              name: 'reference',
              to: expect.arrayContaining([
                expect.objectContaining({type: 'author'}),
                expect.objectContaining({type: 'post'}),
              ]),
            }),
          ]),
        }),
      ]),
    )
  })

  test('limited to specfic content type', async ({schemas}) => {
    const post = schemas.find((schema) => schema.name === 'post')
    const pteField = post?.fields.find((field) => field.name === 'intro') as ArraySanityFieldSchema
    const blockType = pteField.of.find((field) => field.type === 'block') as BlockDefinition
    expect(blockType.marks?.annotations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'object',
          name: 'internalLink',
          title: 'Internal link',
          fields: expect.arrayContaining([
            expect.objectContaining({
              type: 'reference',
              name: 'reference',
              to: [{type: 'author'}],
            }),
          ]),
        }),
      ]),
    )
  })
})
