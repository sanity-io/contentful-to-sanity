import type {ContentTypeProps} from 'contentful-management'
import compact from 'just-compact'

import {isReservedName} from '../helpers/sanity/reservedNames'
import type {ContentfulExport} from '../types'
import {SanityDocumentSchema} from '../types'
import {contentfulFieldToSanityField} from './contentfulFieldToSanityField'
import {findEditorControlForField} from './findEditorControlForField'

type Flags = {
  keepMarkdown: boolean
}

export function contentfulTypeToSanitySchema(
  contentType: ContentTypeProps,
  data: ContentfulExport,
  flags: Flags,
): SanityDocumentSchema {
  const nameCollision = isReservedName(contentType.sys.id)
  if (nameCollision) {
    // eslint-disable-next-line no-console
    console.warn(
      `The Contentful content type "${contentType.sys.id}" is a reserved name in Sanity. Renaming to "contentful_${contentType.sys.id}"`,
    )
  }

  const schemaType: SanityDocumentSchema = {
    type: 'document',
    name: nameCollision ? `contentful_${contentType.sys.id}` : contentType.sys.id,
    title: contentType.name,
    description: contentType.description,
    fields: [],
  }

  if (contentType.displayField) {
    const control = findEditorControlForField(contentType.displayField, contentType.sys.id, data)

    schemaType.preview = {
      select: {
        title:
          control?.widgetId === 'slugEditor'
            ? `${contentType.displayField}.current`
            : contentType.displayField,
      },
    }
  }

  // @ts-expect-error - @TODO fix up the schema definitions
  schemaType.fields = compact(
    contentType.fields
      .filter(({omitted}) => !omitted)
      .map((field) => contentfulFieldToSanityField(contentType, field, data, flags)),
  )

  if (schemaType.type == `document`) {
    schemaType.fields.push({
      type: 'boolean',
      description:
        'If this document was archived on Contentful at the time of export, the document will be in a read-only state.',
      name: 'contentfulArchived',
      readOnly: true,
    })
    schemaType.readOnly = ({document}) => document?.contentfulArchived === true
  }

  return schemaType
}
