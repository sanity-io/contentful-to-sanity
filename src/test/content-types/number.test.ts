import type {ContentfulExport} from 'contentful-export'
import {
  contentfulContentTypeFactory,
  contentfulEditorControlFactory,
  contentfulEditorInterfaceFactory,
} from 'test/helpers'
import {describe, expect, test} from 'vitest'

import {contentfulTypeToSanitySchema} from '@/utils'

describe('create schema for Number type', () => {
  const contentType = contentfulContentTypeFactory(
    'contentType',
    [
      {
        id: 'field',
        name: 'field',
        type: 'Number',
        localized: false,
        required: false,
      },
    ],
    'field',
  )

  test('should create a Sanity schema for rating', () => {
    const data: ContentfulExport = {
      editorInterfaces: [
        contentfulEditorInterfaceFactory('contentType', [
          contentfulEditorControlFactory('field', 'rating'),
        ]),
      ],
      contentTypes: [contentType],
    }

    expect(contentfulTypeToSanitySchema(contentType, data).fields[0]).to.deep.equal({
      name: 'field',
      type: 'number',
      title: 'field',
      options: {
        list: [1, 2, 3, 4, 5],
      },
    })
  })

  test('should create a Sanity schema for numberEditor', () => {
    const data: ContentfulExport = {
      editorInterfaces: [
        contentfulEditorInterfaceFactory('contentType', [
          contentfulEditorControlFactory('field', 'numberEditor'),
        ]),
      ],
      contentTypes: [contentType],
    }

    expect(contentfulTypeToSanitySchema(contentType, data).fields[0]).to.deep.equal({
      name: 'field',
      type: 'number',
      title: 'field',
    })
  })
})
