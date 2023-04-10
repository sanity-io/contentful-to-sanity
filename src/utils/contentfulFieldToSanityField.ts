import {ContentFields, ContentTypeProps} from 'contentful-management'

import {
  arrayFieldSchemaFactory,
  blockFieldSchemaFactory,
  booleanFieldSchemaFactory,
  dateFieldSchemaFactory,
  datetimeFieldSchemaFactory,
  fileFieldSchemaFactory,
  geopointFieldSchemaFactory,
  imageFieldSchemaFactory,
  numberFieldSchemaFactory,
  referenceFieldSchemaFactory,
  slugFieldSchemaFactory,
  stringFieldSchemaFactory,
  textFieldSchemaFactory,
  urlFieldSchemaFactory,
} from '../helpers/sanity/fieldSchemaFactories'
import type {ContentfulExport, SlugSanityFieldSchemaOptions} from '../types'
import {AnySanityFieldSchema, StringSanityFieldSchema} from '../types'
import {contentfulFieldItemToSanityOfType} from './contentfulFieldItemToSanityOfType'
import {extractContentfulRichTextFieldParameters} from './extractContentfulRichTextFieldParameters'
import {extractValidationRulesFromContentfulField} from './extractValidationRulesFromContentfulField'
import {findEditorControlForField} from './findEditorControlForField'

const BuiltInContentfulEditors: Record<string, string> = {
  Integer: 'numberEditor',
  Number: 'numberEditor',
  Symbol: 'singleLine',
  Location: 'locationEditor',
  Boolean: 'boolean',
  Date: 'datePicker',
  Object: 'objectEditor',
}

export function contentfulFieldToSanityField(
  contentType: ContentTypeProps,
  field: ContentFields,
  data: ContentfulExport,
  flags: {keepMarkdown: boolean},
): AnySanityFieldSchema | null {
  const control = findEditorControlForField(field.id, contentType.sys.id, data)

  if (control) {
    const availableTypeIds = new Set((data.contentTypes ?? []).map((type) => type.sys.id))
    const widgetId = control.widgetId || BuiltInContentfulEditors[field.type]
    // @README the default value object is per locale, will be picked up in stringification
    const defaultValue = field.defaultValue
    const helpText = control.settings?.helpText as string | undefined
    let onlyAllowValues = field.validations?.find((validation) => Boolean(validation.in))?.in
    const validationRules = extractValidationRulesFromContentfulField(field)

    if (field.type === 'Symbol') {
      if (widgetId === 'urlEditor') {
        const factory = urlFieldSchemaFactory(field.id)
          .title(field.name)
          .hidden(field.disabled)
          .description(helpText)
          .initialValue(defaultValue)
          .validation([
            ...validationRules,
            {
              flag: 'uri',
              constraint: {
                options: {
                  allowCredentials: true,
                  allowRelative: true,
                  relativeOnly: false,
                  scheme: [/^http/, /^https/],
                },
              },
            },
          ])
        return factory.build()
      }

      if (widgetId === 'slugEditor') {
        const sourceField =
          (control.settings?.trackingFieldId as string | undefined) || contentType.displayField
        const factory = slugFieldSchemaFactory(field.id)
          .title(field.name)
          .hidden(field.disabled)
          .description(helpText)
          .initialValue(defaultValue)

        const options: SlugSanityFieldSchemaOptions = {
          source: sourceField,
        }

        let slugValidation = validationRules.filter((rule) => rule.flag !== 'unique')

        const size = field.validations?.find((validation) => Boolean(validation.size))?.size
        if (size?.max) {
          options.maxLength = size.max
          slugValidation = slugValidation.filter((rule) => rule.flag !== 'max')
        }

        factory.validation(slugValidation)
        factory.options(options)
        return factory.build()
      }

      const factory = stringFieldSchemaFactory(field.id)
        .title(field.name)
        .hidden(field.disabled)
        .description(helpText)
        .initialValue(defaultValue)
        .validation(validationRules)
      factory.options({
        list: onlyAllowValues?.length ? onlyAllowValues.map((v) => String(v)) : undefined,
        layout: widgetId === 'radio' || widgetId === 'dropdown' ? widgetId : undefined,
      })
      return factory.build()
    }

    if (field.type === 'Boolean') {
      const factory = booleanFieldSchemaFactory(field.id)
        .title(field.name)
        .hidden(field.disabled)
        .description(helpText)
        .initialValue(defaultValue)
        .validation(validationRules)
      if (control.settings?.trueLabel || control.settings?.falseLabel) {
        // eslint-disable-next-line no-console
        console.warn(`Custom True and False labels are not supported by default (${field.id})`)
      }

      return factory.build()
    }

    if (field.type === 'Date') {
      const ampm = (control.settings?.ampm ?? 24) as 12 | 24
      const format = (control.settings?.format ?? 'timeZ') as 'timeZ' | 'time' | 'dateonly'
      if (format === 'dateonly') {
        const factory = dateFieldSchemaFactory(field.id)
          .title(field.name)
          .hidden(field.disabled)
          .description(helpText)
          .initialValue(defaultValue)
          .validation(validationRules)
        return factory.build()
      }

      const factory = datetimeFieldSchemaFactory(field.id)
        .title(field.name)
        .hidden(field.disabled)
        .description(helpText)
        .initialValue(defaultValue)
        .validation(validationRules)
        .options({
          timeFormat: `${ampm === 12 ? 'h:mm a' : 'H:mm'}${format === 'timeZ' ? 'Z' : ''}`,
        })
      return factory.build()
    }

    if (field.type === 'Location') {
      // @README contentful does not support default geopoint value
      return geopointFieldSchemaFactory(field.id)
        .title(field.name)
        .hidden(field.disabled)
        .description(helpText)
        .validation(validationRules)
        .build()
    }

    if (field.type === 'Number' || field.type === 'Integer') {
      if (widgetId === 'rating' && !onlyAllowValues?.length) {
        const maxValue = Number(control.settings?.stars ?? 5)
        const onlyValues: number[] = []
        for (let i = 1; i <= maxValue; i++) {
          onlyValues.push(i)
        }

        onlyAllowValues = onlyValues
      }

      const factory = numberFieldSchemaFactory(field.id)
        .title(field.name)
        .hidden(field.disabled)
        .description(helpText)
        .initialValue(defaultValue)
        .validation(validationRules)
      factory.options({
        list: onlyAllowValues?.length
          ? onlyAllowValues.map((v) => Number.parseFloat(String(v)))
          : undefined,
        layout: widgetId === 'radio' || widgetId === 'dropdown' ? widgetId : undefined,
      })
      return factory.build()
    }

    if (field.type === 'Text') {
      if (widgetId === 'multipleLine' || (widgetId === 'markdown' && flags.keepMarkdown)) {
        return textFieldSchemaFactory(field.id)
          .title(field.name)
          .hidden(field.disabled)
          .description(helpText)
          .initialValue(defaultValue)
          .validation(validationRules)
          .build()
      }

      return arrayFieldSchemaFactory(field.id)
        .title(field.name)
        .hidden(field.disabled)
        .description(helpText)
        .initialValue(defaultValue)
        .validation(validationRules)
        .of([
          blockFieldSchemaFactory('block').anonymous(),
          imageFieldSchemaFactory('image').anonymous(),
        ])
        .build()
    }

    if (field.type === 'RichText') {
      const richTextOptions = extractContentfulRichTextFieldParameters(field, data)

      const blockFactory = blockFieldSchemaFactory('block')
        .styles(richTextOptions.styles)
        .lists(richTextOptions.lists)
        .marks(richTextOptions.marks)
      if (
        richTextOptions.canEmbedEntriesInline &&
        richTextOptions.supportedEmbeddedInlineTypes?.length
      ) {
        blockFactory.of([
          {
            type: 'reference',
            title: 'Reference',
            // @ts-expect-error - the types for LinkedType are wrong in this
            // project. It should have a `to` property
            to: richTextOptions.supportedEmbeddedInlineTypes.map((linkType) => ({
              type: linkType.type,
            })),
          },
        ])
      }

      const factory = arrayFieldSchemaFactory(field.id)
        .title(field.name)
        .hidden(field.disabled)
        .description(helpText)
        .initialValue(defaultValue)
        .validation(validationRules)
      factory.of([
        blockFactory.anonymous(),
        ...(richTextOptions.canEmbedEntries && richTextOptions.supportedEmbeddedBlockTypes?.length
          ? [
              {
                type: 'reference',
                title: 'Reference',
                // @ts-expect-error - the types for LinkedType are wrong in this
                // project. It should have a `to` property
                to: richTextOptions.supportedEmbeddedBlockTypes.map((linkType) => ({
                  type: linkType.type,
                })),
              },
            ]
          : []),
        ...(richTextOptions.canEmbedAssets ? [{type: 'image'}, {type: 'file'}] : []),
        ...(richTextOptions.canUseBreaks ? [{type: 'break'}] : []),
      ])
      return factory.build()
    }

    if (field.type === 'Link') {
      const linkContentTypeValidation = field.validations?.find((validation) =>
        Boolean(validation.linkContentType),
      )
      const linkMimetypeGroupValidation = field.validations?.find((validation) =>
        Boolean(validation.linkMimetypeGroup),
      )

      if (field.linkType === 'Asset') {
        const onlyAcceptsImages =
          linkMimetypeGroupValidation?.linkMimetypeGroup?.includes('image') &&
          linkMimetypeGroupValidation?.linkMimetypeGroup.length === 1

        if (onlyAcceptsImages) {
          return imageFieldSchemaFactory(field.id)
            .title(field.name)
            .hidden(field.disabled)
            .description(helpText)
            .validation(validationRules)
            .build()
        }

        return fileFieldSchemaFactory(field.id)
          .title(field.name)
          .hidden(field.disabled)
          .description(helpText)
          .validation(validationRules)
          .build()
      }

      const factory = referenceFieldSchemaFactory(field.id)
        .title(field.name)
        .hidden(field.disabled)
        .description(helpText)
        .validation(validationRules)
      if (linkContentTypeValidation?.linkContentType?.length) {
        factory.to(
          linkContentTypeValidation.linkContentType
            .filter((type) => availableTypeIds.has(type))
            .map((type) => ({type})),
        )
      } else if (data.contentTypes) {
        factory.to(data.contentTypes.map((type) => ({type: type.sys.id})))
      }

      return factory.build()
    }

    if (field.type === 'Array') {
      const factory = arrayFieldSchemaFactory(field.id)
        .title(field.name)
        .hidden(field.disabled)
        .description(helpText)
        .validation(validationRules)

      if (widgetId === 'entryCardsEditor') {
        factory.options({layout: 'grid'})
      }

      if (widgetId === 'tagEditor') {
        factory.options({layout: 'tags'})
      }

      if (field.items) {
        const ofType = contentfulFieldItemToSanityOfType(field.items, data)
        if (ofType) {
          factory.of([ofType])

          const itemListValues = ofType.options?.list as Exclude<
            StringSanityFieldSchema['options'],
            undefined
          >['list']

          if (widgetId === 'checkbox' && itemListValues?.length) {
            factory.options({
              list: itemListValues.map((value) => ({
                value: typeof value === 'string' ? String(value) : value.value,
                title: typeof value === 'string' ? String(value) : value.title,
              })),
            })
          }
        }
      }

      return factory.build()
    }
  }

  return null
}
