import type {ContentFields} from 'contentful-management'
import {ContentfulExport} from 'types'

import {
  fileFieldSchemaFactory,
  imageFieldSchemaFactory,
  referenceFieldSchemaFactory,
  stringFieldSchemaFactory,
} from '@/helpers/sanity/fieldSchemaFactories'
import {LinkedType} from '@/types'

import {extractValidationRulesFromContentfulField} from './extractValidationRulesFromContentfulField'

export function contentfulFieldItemToSanityOfType(
  field: Exclude<ContentFields['items'], undefined>,
  data: ContentfulExport,
): LinkedType | null {
  const availableTypeIds = new Set((data.contentTypes ?? []).map((type) => type.sys.id))
  const validationRules = extractValidationRulesFromContentfulField(field)
  const onlyAllowValues = field.validations?.find((validation) => Boolean(validation.in))?.in
  const linkContentTypeValidation = field.validations?.find((validation) =>
    Boolean(validation.linkContentType),
  )
  const linkMimetypeGroupValidation = field.validations?.find((validation) =>
    Boolean(validation.linkMimetypeGroup),
  )

  if (field.type === 'Symbol') {
    return stringFieldSchemaFactory('string')
      .validation(validationRules)
      .options({list: onlyAllowValues?.map((v) => String(v))})
      .anonymous()
  }

  if (field.type === 'Link') {
    if (field.linkType === 'Asset') {
      const onlyAcceptsImages =
        linkMimetypeGroupValidation?.linkMimetypeGroup?.includes('image') &&
        linkMimetypeGroupValidation?.linkMimetypeGroup.length === 1

      if (onlyAcceptsImages) {
        return imageFieldSchemaFactory('image').validation(validationRules).anonymous()
      }

      return fileFieldSchemaFactory('file').validation(validationRules).anonymous()
    }

    const factory = referenceFieldSchemaFactory('reference').validation(validationRules)
    if (linkContentTypeValidation?.linkContentType?.length) {
      factory.to(
        linkContentTypeValidation.linkContentType
          .filter((type) => availableTypeIds.has(type))
          .map((type) => ({type})),
      )
    }

    return factory.anonymous()
  }

  return null
}
