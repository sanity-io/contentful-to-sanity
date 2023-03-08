import {
  contentfulContentTypeFactory,
  contentfulEditorControlFactory,
  contentfulEditorInterfaceFactory,
} from 'test/helpers'
import type {ContentfulExport} from '../../types'
import {describe, expect, test} from 'vitest'

import {contentfulTypeToSanitySchema} from '../../utils'

describe('create schema for Integer type', () => {
  const contentType = contentfulContentTypeFactory(
    'contentType',
    [
      {
        id: 'field',
        name: 'field',
        type: 'Integer',
        localized: false,
        required: false,
      },
    ],
    'field',
  )

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
      validation: [{flag: 'integer'}],
    })
  })
})
