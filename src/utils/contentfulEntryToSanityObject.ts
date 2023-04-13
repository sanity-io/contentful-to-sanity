import {toPortableText} from '@portabletext/contentful-rich-text-to-portable-text'
import type {SanityDocument} from '@sanity/client'
import type {EntryProps} from 'contentful-management'
import compact from 'just-compact'
import objectHash from 'object-hash'

import type {ContentfulExport} from '../types'
import {contentfulLinkToSanityReference} from './contentfulLinkToSanityReference'
import {contentfulTypeNameToSanityTypeName} from './contentfulTypeNameToSanityTypeName'
import {createIntlFields} from './createIntlFields'
import {findEditorControlForField} from './findEditorControlForField'
import {generateKey} from './generateKey'
import {markdownToBlocks} from './markdownToBlocks'
import type {SysLink} from './objectIsContentfulLink'
import {objectIsContentfulLink} from './objectIsContentfulLink'
import {objectIsContentfulLocation} from './objectIsContentfulLocation'
import {objectIsContentfulRichText} from './objectIsContentfulRichText'

type ReferenceResolver = (
  node: {data: {target: SysLink}},
  opts: any,
) => ReturnType<typeof contentfulLinkToSanityReference> | null

type Options = {
  useMultiLocale: boolean
  idStructure: 'subpath' | 'delimiter'
  defaultLocale: string
  supportedLocales: string[]
  keepMarkdown?: boolean
  weakRefs?: boolean
}

export function contentfulEntryToSanityObject(
  id: string,
  entry: EntryProps<Record<string, Record<string, any>>>,
  locale: string,
  data: ContentfulExport,
  options: Options,
): SanityDocument {
  let doc: SanityDocument = {
    _id: id,
    _rev: entry.sys.id,
    _type: contentfulTypeNameToSanityTypeName(entry.sys.contentType.sys.id).name,
    _createdAt: entry.sys.createdAt,
    _updatedAt: entry.sys.updatedAt,
  }

  if (options.useMultiLocale) {
    doc = {
      ...doc,
      ...createIntlFields(doc._id, locale, {
        idStructure: options.idStructure,
        defaultLocale: options.defaultLocale,
        supportedLocales: options.supportedLocales,
      }),
    }
  }

  const fields = Object.entries<Record<string, any>>(entry.fields)
  for (const [key, values] of fields) {
    const control = findEditorControlForField(key, entry.sys.contentType.sys.id, data)
    const widgetId = control?.widgetId

    const value = values[locale]
    const canCopyValueAsIs =
      typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
    if (canCopyValueAsIs) {
      if (widgetId === 'slugEditor') {
        doc[key] = {current: value}
      } else if (widgetId === 'markdown' && !options.keepMarkdown) {
        doc[key] = markdownToBlocks(String(value))
      } else {
        doc[key] = value
      }
    } else if (widgetId === 'objectEditor' && typeof value === 'object') {
      doc[key] = JSON.stringify(value)
    } else if (objectIsContentfulLink(value)) {
      doc[key] = contentfulLinkToSanityReference(id, value, locale, data, options)
    } else if (objectIsContentfulLocation(value)) {
      doc[key] = {
        _type: 'geopoint',
        lat: value.lat,
        lng: value.lon,
      }
    } else if (objectIsContentfulRichText(value)) {
      const referenceResolver: ReferenceResolver = (node) =>
        contentfulLinkToSanityReference(id, node.data.target, locale, data, options)

      doc[key] = toPortableText(value, {
        generateKey: (node) => `k${objectHash(node).slice(0, 7)}`,
        referenceResolver,
        transformers: {
          hr: () => [
            {
              _type: 'break',
              _key: generateKey(),
              style: 'lineBreak',
            },
          ],
        },
      })
    } else if (Array.isArray(value)) {
      doc[key] = compact(
        value.map((val) => {
          if (objectIsContentfulLink(val)) {
            return contentfulLinkToSanityReference(id, val, locale, data, options)
          }

          return val
        }),
      )
    }
  }

  return doc
}
