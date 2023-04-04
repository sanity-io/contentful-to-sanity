import {DocumentDefinition} from '@sanity/types'
import type {ContentTypeProps} from 'contentful-management'
import {beforeEach, describe, expect, test} from 'vitest'

import {contentfulTypeToSanitySchema} from '../utils'

declare module 'vitest' {
  export interface TestContext {
    schemas: DocumentDefinition[]
  }
}

beforeEach(async (context) => {
  const {default: data} = await import('./fixtures/assetFields.json')
  const sanityContentTypes = []
  for (const contentType of data.contentTypes || []) {
    sanityContentTypes.push(
      contentfulTypeToSanitySchema(contentType as ContentTypeProps, data as any, {
        keepMarkdown: true,
      }),
    )
  }
  context.schemas = sanityContentTypes
})

describe('Asset fields', async () => {
  test('image field', async ({schemas}) => {
    const doc = schemas[0]
    const imageField = doc.fields.find((field) => field.name === 'image')
    expect(imageField).toBeDefined()
    expect(imageField?.type).toEqual('image')
  })
  test('asset field', async ({schemas}) => {
    const doc = schemas[0]
    const assetField = doc.fields.find((field) => field.name === 'asset')
    expect(assetField).toBeDefined()
    expect(assetField?.type).toEqual('file')
  })
  test('pdf field', async ({schemas}) => {
    const doc = schemas[0]
    const pdfField = doc.fields.find((field) => field.name === 'pdf')
    expect(pdfField).toBeDefined()
    expect(pdfField?.type).toEqual('file')
  })
})
