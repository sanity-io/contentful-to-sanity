import {SanityDocument} from '@sanity/client'
import compact from 'just-compact'
import invariant from 'tiny-invariant'

import {type ContentfulExport} from '../types'
import {isPublished} from '../utils/contentfulEntry'
import {contentfulEntryToSanityObject} from '../utils/contentfulEntryToSanityObject'
import {ContentfulNoDefaultLocaleError} from './errors/ContentfulNoDefaultLocaleError'
import {ContentfulNoLocalesError} from './errors/ContentfulNoLocalesError'

export async function contentfulToDataset(
  exports: {
    drafts: ContentfulExport
    published?: ContentfulExport
  },
  opts: {
    intlMode: 'single' | 'multiple'
    weakRefs: boolean
    intlIdStructure: 'subpath' | 'delimiter'
    keepMarkdown: boolean
    locale: string | undefined
  },
): Promise<string> {
  const parseExport = (data: ContentfulExport, isContentDeliveryAPIExport = false) => {
    const useMultiLocale = opts.intlMode === 'multiple'
    const defaultLocale = data.locales?.find((locale) => Boolean(locale.default))
    if (!defaultLocale) {
      throw new ContentfulNoDefaultLocaleError()
    }
    const localesToImport = (
      useMultiLocale
        ? (data.locales ?? []).map(({code}) => code)
        : opts.locale
        ? [opts.locale]
        : compact([defaultLocale?.code])
    ).filter((code) => data?.locales?.some((locale) => locale.code === code))

    if (!defaultLocale) {
      throw new ContentfulNoDefaultLocaleError()
    }

    if (localesToImport.length === 0) {
      throw new ContentfulNoLocalesError()
    }

    invariant(data.entries, 'Expected data.entries to be defined')
    invariant(data.entries.length > 0, 'Expected data.entries to be defined')

    const importableEntries: Set<SanityDocument> = new Set()
    for (const entry of data.entries) {
      for (const locale of localesToImport) {
        // We only want to import published entries if we're importing from the Content Delivery API
        if (!isContentDeliveryAPIExport && isPublished(entry)) continue
        const id = isContentDeliveryAPIExport
          ? entry.sys.id
          : isPublished(entry)
          ? entry.sys.id
          : `drafts.${entry.sys.id}`
        importableEntries.add(
          contentfulEntryToSanityObject(id, entry, locale, data, {
            useMultiLocale,
            idStructure: opts.intlIdStructure,
            defaultLocale: defaultLocale.code,
            supportedLocales: localesToImport,
            keepMarkdown: opts.keepMarkdown,
            weakRefs: opts.weakRefs,
          }),
        )
      }
    }

    return [...importableEntries].map((entry) => JSON.stringify(entry)).join('\n')
  }

  return [
    exports.drafts ? parseExport(exports.drafts, false) : '',
    exports.published ? parseExport(exports.published, true) : '',
  ]
    .filter((line) => line.length)
    .join('\n')
}
