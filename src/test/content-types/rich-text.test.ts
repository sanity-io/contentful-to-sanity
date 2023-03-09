/* eslint-disable @typescript-eslint/no-explicit-any */
import {describe, expect, test} from 'vitest'

import type {ContentfulExport} from '../../types'
import {contentfulTypeToSanitySchema} from '../../utils'
import {
  contentfulContentTypeFactory,
  contentfulEditorControlFactory,
  contentfulEditorInterfaceFactory,
} from '../helpers'

describe('create schema for RichText type', () => {
  const contentType = contentfulContentTypeFactory(
    'contentType',
    [
      {
        id: 'field',
        name: 'field',
        type: 'RichText',
        localized: false,
        required: false,
        validations: [
          {
            enabledNodeTypes: [
              'heading-1',
              'embedded-entry-block',
              'embedded-asset-block',
              'ordered-list',
              'hyperlink',
              'entry-hyperlink',
              'hr',
            ],
          },
          {enabledMarks: ['bold']},
          {
            nodes: {
              'embedded-entry-block': [{linkContentType: ['contentType']}],
              'entry-hyperlink': [{linkContentType: ['contentType']}],
            },
          } as any,
        ],
      },
    ],
    'field',
  )

  test('should create a Sanity schema for richTextEditor', () => {
    const data: ContentfulExport = {
      editorInterfaces: [
        contentfulEditorInterfaceFactory('contentType', [
          contentfulEditorControlFactory('field', 'richTextEditor'),
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
          type: 'block',
          lists: [
            {
              title: 'Numbered',
              value: 'number',
            },
          ],
          marks: {
            annotations: [
              {
                title: 'url',
                name: 'link',
                type: 'object',
                fields: [
                  {
                    name: 'href',
                    title: 'URL',
                    type: 'string',
                    validation: [{constraint: 'required', flag: 'presence'}],
                  },
                  {
                    name: 'target',
                    title: 'Target',
                    type: 'string',
                    options: {
                      list: [
                        {title: 'Blank', value: '_blank'},
                        {title: 'Parent', value: '_parent'},
                      ],
                    },
                  },
                ],
              },
              {
                type: 'reference',
                to: [{type: 'contentType'}],
              },
            ],
            decorators: [
              {
                title: 'Strong',
                value: 'strong',
              },
            ],
          },
          styles: [
            {
              title: 'Heading 1',
              value: 'h1',
            },
          ],
        },
        {
          type: 'contentType',
        },
        {
          type: 'image',
        },
        {
          type: 'file',
        },
        {
          type: 'break',
        },
      ],
    })
  })
})
