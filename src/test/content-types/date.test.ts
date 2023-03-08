import {
  contentfulContentTypeFactory,
  contentfulEditorControlFactory,
  contentfulEditorInterfaceFactory,
} from 'test/helpers'
import type {ContentfulExport} from '../../types'
import {describe, expect, test} from 'vitest'

import {contentfulTypeToSanitySchema} from '../../utils'

describe('create schema for Date type', () => {
  const contentType = contentfulContentTypeFactory(
    'contentType',
    [
      {
        id: 'field',
        name: 'field',
        type: 'Date',
        localized: false,
        required: false,
      },
    ],
    'field',
  )

  test('should create a Sanity schema for date format', () => {
    const data: ContentfulExport = {
      editorInterfaces: [
        contentfulEditorInterfaceFactory('contentType', [
          contentfulEditorControlFactory('field', 'datePicker', 'builtin', {
            format: 'dateonly',
          }),
        ]),
      ],
      contentTypes: [contentType],
    }

    expect(contentfulTypeToSanitySchema(contentType, data).fields[0]).to.deep.equal({
      name: 'field',
      type: 'date',
      title: 'field',
    })
  })

  test('should create a Sanity schema for date & time format', () => {
    const data: ContentfulExport = {
      editorInterfaces: [
        contentfulEditorInterfaceFactory('contentType', [
          contentfulEditorControlFactory('field', 'datePicker', 'builtin', {
            format: 'timeZ',
          }),
        ]),
      ],
      contentTypes: [contentType],
    }

    expect(contentfulTypeToSanitySchema(contentType, data).fields[0]).to.deep.equal({
      name: 'field',
      type: 'datetime',
      title: 'field',
      options: {
        timeFormat: 'H:mmZ',
      },
    })
  })
})
