import compact from 'just-compact'
import {SanityDocumentSchema} from '@/types'
import {contentfulFieldToSanityField} from './contentfulFieldToSanityField'
import type {ContentTypeProps} from 'contentful-management'
import type {ContentfulExport} from 'contentful-export'
import {findEditorControlForField} from './findEditorControlForField'

type Flags = {
  'keep-markdown'?: boolean
}

export function contentfulTypeToSanitySchema(
  contentType: ContentTypeProps,
  data: ContentfulExport,
  flags: Flags = {},
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

  schemaType.fields = compact(
    contentType.fields
      .filter(({omitted}) => !omitted)
      .map((field) => contentfulFieldToSanityField(contentType, field, data, flags)),
  )

  return schemaType
}
