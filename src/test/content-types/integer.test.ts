import {describe, expect, test} from 'vitest'

import type {ContentfulExport} from '../../types'
import {contentfulTypeToSanitySchema} from '../../utils'
import {contentfulContentTypeFactory} from '../helpers/contentfulContentTypeFactory'
import {contentfulEditorControlFactory} from '../helpers/contentfulEditorControlFactory'
import {contentfulEditorInterfaceFactory} from '../helpers/contentfulEditorInterfaceFactory'

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

    expect(
      contentfulTypeToSanitySchema(contentType, data, {keepMarkdown: false}).fields[0],
    ).to.deep.equal({
      name: 'field',
      type: 'number',
      title: 'field',
      validation: [{flag: 'integer'}],
    })
  })
})
