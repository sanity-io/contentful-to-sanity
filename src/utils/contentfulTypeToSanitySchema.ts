import type {ContentTypeProps} from 'contentful-management'
import compact from 'just-compact'

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
  const schemaType: SanityDocumentSchema = {
    type: 'document',
    name: contentType.sys.id,
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

  return schemaType
}
