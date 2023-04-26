import type {ContentTypeProps} from 'contentful-management'
import {describe, expect, test} from 'vitest'

import {contentfulToDataset} from '../helpers/contentfulToDataset'
import {contentfulTypeToSanitySchema} from '../utils'
import {parse} from './helpers'

describe('Boolean fields', async () => {
  test('creates the Sanity field', async () => {
    const {default: data} = await import('./fixtures/booleans.json')
    const sanityContentTypes = []
    for (const contentType of data.contentTypes) {
      sanityContentTypes.push(
        contentfulTypeToSanitySchema(contentType as ContentTypeProps, data as any, {
          keepMarkdown: true,
        }),
      )
    }
    expect(sanityContentTypes.length).toBe(1)
    const person = sanityContentTypes[0]
    const isGreat = person.fields.find((field) => field.name === 'isGreat')
    expect(isGreat).toBeDefined()
    expect(isGreat).toMatchObject({
      type: 'boolean',
      description: 'Boolean help text',
    })
    const validations = isGreat?.validation
    const isRequired = Array.isArray(validations) && validations[0]
    expect(isRequired && isRequired).toMatchObject({
      constraint: 'required',
      flag: 'presence',
    })
  })

  test('dataset action sets field to "true"', async () => {
    const {default: drafts} = await import('./fixtures/booleans.json')
    const {default: published} = await import('./fixtures/booleans.published.json')
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

    const person = docs.find((doc) => doc._type == 'person')
    expect(person).toBeDefined()
    expect(person).toHaveProperty('isGreat', true)
  })
})
