import {describe, expect, test} from 'vitest'

import type {ContentfulExport} from '../../types'
import {contentfulTypeToSanitySchema} from '../../utils/contentfulTypeToSanitySchema'
import {contentfulContentTypeFactory} from '../helpers/contentfulContentTypeFactory'
import {contentfulEditorControlFactory} from '../helpers/contentfulEditorControlFactory'
import {contentfulEditorInterfaceFactory} from '../helpers/contentfulEditorInterfaceFactory'

describe('create schema for Array type', () => {
  const contentType = contentfulContentTypeFactory(
    'contentType',
    [
      {
        id: 'field',
        name: 'field',
        type: 'Array',
        localized: false,
        required: false,
        items: {
          type: 'Symbol',
        },
      },
    ],
    'field',
  )

  test('should create a Sanity schema for tagEditor', () => {
    const data: ContentfulExport = {
      editorInterfaces: [
        contentfulEditorInterfaceFactory('contentType', [
          contentfulEditorControlFactory('field', 'tagEditor'),
        ]),
      ],
      contentTypes: [contentType],
    }

    expect(
      contentfulTypeToSanitySchema(contentType, data, {keepMarkdown: false}).fields[0],
    ).to.deep.equal({
      name: 'field',
      type: 'array',
      title: 'field',
      of: [
        {
          type: 'string',
        },
      ],
      options: {
        layout: 'tag',
      },
    })
  })
})
