import {describe, expect, test} from 'vitest'

import type {ContentfulExport} from '../../types'
import {contentfulTypeToSanitySchema} from '../../utils'
import {
  contentfulContentTypeFactory,
  contentfulEditorControlFactory,
  contentfulEditorInterfaceFactory,
} from '../helpers'

describe('create schema for Symbol type', () => {
  const contentType = contentfulContentTypeFactory(
    'contentType',
    [
      {
        id: 'field',
        name: 'field',
        type: 'Symbol',
        localized: false,
        required: false,
      },
    ],
    'field',
  )

  test('should create a Sanity schema for urlEditor', () => {
    const data: ContentfulExport = {
      editorInterfaces: [
        contentfulEditorInterfaceFactory('contentType', [
          contentfulEditorControlFactory('field', 'urlEditor'),
        ]),
      ],
      contentTypes: [contentType],
    }

    expect(
      contentfulTypeToSanitySchema(contentType, data, {keepMarkdown: false}).fields[0],
    ).to.deep.equal({
      name: 'field',
      type: 'url',
      title: 'field',
      validation: [
        {
          constraint: {
            options: {
              allowCredentials: true,
              allowRelative: true,
              relativeOnly: false,
              scheme: [/^http/, /^https/],
            },
          },
          flag: 'uri',
        },
      ],
    })
  })

  test('should create a Sanity schema for slugEditor', () => {
    const data: ContentfulExport = {
      editorInterfaces: [
        contentfulEditorInterfaceFactory('contentType', [
          contentfulEditorControlFactory('field', 'slugEditor', 'builtin', {
            trackingFieldId: 'title',
          }),
        ]),
      ],
      contentTypes: [contentType],
    }

    const schema = contentfulTypeToSanitySchema(contentType, data, {keepMarkdown: false})

    expect(schema.preview?.select?.title).to.equal('field.current')

    expect(schema.fields[0]).to.deep.equal({
      name: 'field',
      type: 'slug',
      title: 'field',
      options: {
        source: 'title',
      },
    })
  })

  test('should create a Sanity schema for a dropdown', () => {
    const withOnlyAllowValues: typeof contentType = {
      ...contentType,
      fields: [
        {
          ...contentType.fields[0],
          validations: [
            {
              in: ['foo', 'bar'],
            },
          ],
        },
      ],
    }

    const data: ContentfulExport = {
      editorInterfaces: [
        contentfulEditorInterfaceFactory('contentType', [
          contentfulEditorControlFactory('field', 'dropdown', 'builtin'),
        ]),
      ],
      contentTypes: [withOnlyAllowValues],
    }

    expect(
      contentfulTypeToSanitySchema(withOnlyAllowValues, data, {keepMarkdown: false}).fields[0],
    ).to.deep.equal({
      name: 'field',
      type: 'string',
      title: 'field',
      options: {
        list: ['foo', 'bar'],
        layout: 'dropdown',
      },
    })
  })
})
