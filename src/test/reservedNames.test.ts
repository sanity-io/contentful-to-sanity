import {describe, expect, test} from 'vitest'

import {coreTypes} from '../helpers/sanity/reservedNames'
import type {ContentfulExport} from '../types'
import {contentfulTypeToSanitySchema} from '../utils'
import {
  contentfulContentTypeFactory,
  contentfulEditorControlFactory,
  contentfulEditorInterfaceFactory,
} from './helpers'

const schemaWithContentfulName = (name: string) => {
  const contentType = contentfulContentTypeFactory(
    name,
    [
      {
        id: 'title',
        name: 'title',
        type: 'Symbol',
        localized: false,
        required: false,
      },
    ],
    'title',
  )

  const data: ContentfulExport = {
    editorInterfaces: [
      contentfulEditorInterfaceFactory(name, [
        contentfulEditorControlFactory('title', 'singleLine'),
      ]),
    ],
    contentTypes: [contentType],
  }

  return contentfulTypeToSanitySchema(contentType, data, {keepMarkdown: false})
}

describe('Reserved schema type names', () => {
  test('reserved names are rewritten to avoid collisions with core types', () => {
    expect(coreTypes.length).toBeGreaterThan(0)
    coreTypes.forEach((type) => {
      const schema = schemaWithContentfulName(type.name)
      expect(schema.name).toBe(`contentful_${type.name}`)
    })
  })

  test('reserved names are rewritten to avoid collisions with system types', () => {
    const systemTypes = ['system.group', 'sanity.imageAsset', 'sanity.fileAsset']
    systemTypes.forEach((typeName) => {
      const schema = schemaWithContentfulName(typeName)
      expect(schema.name).toBe(`contentful_${typeName}`)
    })
  })
})
