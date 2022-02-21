import {contentfulTypeToSanitySchema} from '@/utils'
import {expect, test} from '@oclif/test'
import type {ContentfulExport} from 'contentful-export'
import {contentfulContentTypeFactory, contentfulEditorControlFactory, contentfulEditorInterfaceFactory} from 'test/helpers'

describe('create schema for Text type', () => {
  const contentType = contentfulContentTypeFactory('contentType', [{
    id: 'field',
    name: 'field',
    type: 'Text',
    localized: false,
    required: false,
  }], 'field')

  test
  .it('should create a Sanity schema for multipleLine', () => {
    const data: ContentfulExport = {
      editorInterfaces: [
        contentfulEditorInterfaceFactory('contentType', [
          contentfulEditorControlFactory('field', 'multipleLine'),
        ]),
      ],
      contentTypes: [contentType],
    }

    expect(contentfulTypeToSanitySchema(contentType, data).fields[0]).to.deep.equal({
      name: 'field',
      type: 'text',
      title: 'field',
    })
  })

  test
  .it('should create a Sanity schema for markdown (keeping markdown)', () => {
    const data: ContentfulExport = {
      editorInterfaces: [
        contentfulEditorInterfaceFactory('contentType', [
          contentfulEditorControlFactory('field', 'markdown'),
        ]),
      ],
      contentTypes: [contentType],
    }

    expect(contentfulTypeToSanitySchema(contentType, data, {'keep-markdown': true}).fields[0]).to.deep.equal({
      name: 'field',
      type: 'text',
      title: 'field',
    })
  })

  test
  .it('should create a Sanity schema for markdown (converting markdown)', () => {
    const data: ContentfulExport = {
      editorInterfaces: [
        contentfulEditorInterfaceFactory('contentType', [
          contentfulEditorControlFactory('field', 'markdown'),
        ]),
      ],
      contentTypes: [contentType],
    }

    expect(contentfulTypeToSanitySchema(contentType, data, {'keep-markdown': false}).fields[0]).to.deep.equal({
      name: 'field',
      type: 'array',
      title: 'field',
      of: [{type: 'block'}, {type: 'image'}],
    })
  })
})
