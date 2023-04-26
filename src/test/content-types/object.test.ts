import {describe, expect, test} from 'vitest'

import {contentfulToDataset} from '../../helpers/contentfulToDataset'
import type {ContentfulExport} from '../../types'
import {contentfulTypeToSanitySchema} from '../../utils'
import {parse} from '../helpers'
import {contentfulContentTypeFactory} from '../helpers/contentfulContentTypeFactory'
import {contentfulEditorControlFactory} from '../helpers/contentfulEditorControlFactory'
import {contentfulEditorInterfaceFactory} from '../helpers/contentfulEditorInterfaceFactory'

const contentType = contentfulContentTypeFactory(
  'contentType',
  [
    {
      id: 'field',
      name: 'field',
      type: 'Object',
      localized: false,
      required: false,
      disabled: false,
      omitted: false,
    },
  ],
  'field',
)
describe('Object', () => {
  describe('schema', () => {
    test('should not create a Sanity schema for object', () => {
      const data: ContentfulExport = {
        editorInterfaces: [
          contentfulEditorInterfaceFactory('contentType', [
            contentfulEditorControlFactory('field', 'objectEditor'),
          ]),
        ],
        contentTypes: [contentType],
      }

      const schema = contentfulTypeToSanitySchema(contentType, data, {keepMarkdown: false})
      expect(schema.fields.filter((field) => field.type === 'object').length).toEqual(0)
    })
  })
  describe('dataset', () => {
    test('should add data for Object even though there is no schema', async () => {
      const {default: drafts} = await import('../fixtures/json.json')
      const {default: published} = await import('../fixtures/json.published.json')
      const options = {
        intlMode: 'single',
        weakRefs: false,
        intlIdStructure: 'delimiter',
        keepMarkdown: false,
        locale: undefined,
      } as const

      const ndjson = await contentfulToDataset(
        {
          drafts: drafts as any,
          published: published as any,
        },
        options,
      )
      const docs = ndjson.split('\n').map(parse)
      const doc = docs.find(d => d._type == 'film')

      expect(doc).toMatchObject(
        expect.objectContaining({
          title: 'Test json',
          json: `{"raw":true}`,
        }),
      )
    })
  })
})
