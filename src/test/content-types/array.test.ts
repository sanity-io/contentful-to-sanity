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
        layout: 'tags',
      },
    })
  })

  test('should create a Sanity schema for a list of entry links', () => {
    const arrayOfLinksContentType = contentfulContentTypeFactory(
      'contentType',
      [
        {
          id: 'field',
          name: 'field',
          type: 'Array',
          localized: false,
          required: false,
          items: {
            type: 'Link',
            validations: [],
            linkType: 'Entry',
          },
        },
      ],
      'field',
    )

    const data: ContentfulExport = {
      editorInterfaces: [
        contentfulEditorInterfaceFactory('contentType', [
          contentfulEditorControlFactory('field', 'entryLinkEditor'),
        ]),
      ],
      contentTypes: [
        arrayOfLinksContentType,
        contentfulContentTypeFactory('person', [], 'name'),
        contentfulContentTypeFactory('post', [], 'name'),
      ],
    }

    expect(
      contentfulTypeToSanitySchema(arrayOfLinksContentType, data, {keepMarkdown: false}).fields[0],
    ).to.deep.equal({
      name: 'field',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'contentType'}, {type: 'person'}, {type: 'post'}]}],
      title: 'field',
    })
  })
})
