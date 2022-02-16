import {contentfulTypeToSanitySchema} from '@/utils'
import {expect, test} from '@oclif/test'
import type {ContentfulExport} from 'contentful-export'
import {contentfulContentTypeFactory, contentfulEditorControlFactory, contentfulEditorInterfaceFactory} from 'test/helpers'

describe('create schema for Link type', () => {
  const contentType = contentfulContentTypeFactory('contentType', [{
    id: 'field',
    name: 'field',
    type: 'Link',
    localized: false,
    required: false,
  }], 'field')

  test
  .it('should create a Sanity schema for an asset link', () => {
    const assetLinkContentType: typeof contentType = {
      ...contentType,
      fields: [{
        ...contentType.fields[0],
        linkType: 'Asset',
        validations: [{linkMimetypeGroup: ['image']}],
      }],
    }

    const data: ContentfulExport = {
      editorInterfaces: [
        contentfulEditorInterfaceFactory('contentType', [
          contentfulEditorControlFactory('field', 'assetLinkEditor'),
        ]),
      ],
      contentTypes: [assetLinkContentType],
    }

    expect(contentfulTypeToSanitySchema(assetLinkContentType, data).fields[0]).to.deep.equal({
      name: 'field',
      type: 'image',
      title: 'field',
    })
  })

  test
  .it('should create a Sanity schema for an entry link', () => {
    const entryLinkContentType: typeof contentType = {
      ...contentType,
      fields: [{
        ...contentType.fields[0],
        linkType: 'Entry',
        validations: [{linkContentType: ['contentType']}],
      }],
    }

    const data: ContentfulExport = {
      editorInterfaces: [
        contentfulEditorInterfaceFactory('contentType', [
          contentfulEditorControlFactory('field', 'entryLinkEditor'),
        ]),
      ],
      contentTypes: [entryLinkContentType],
    }

    expect(contentfulTypeToSanitySchema(entryLinkContentType, data).fields[0]).to.deep.equal({
      name: 'field',
      type: 'reference',
      to: [{type: 'contentType'}],
      title: 'field',
    })
  })
})
