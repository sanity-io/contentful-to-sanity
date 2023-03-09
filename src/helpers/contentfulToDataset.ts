import {SanityDocument} from '@sanity/client'
import compact from 'just-compact'
import invariant from 'tiny-invariant'

import {ContentfulExport} from '../types'
import {contentfulEntryToSanityObject} from '../utils/contentfulEntryToSanityObject'
import {ContentfulNoDefaultLocaleError} from './errors/ContentfulNoDefaultLocaleError'
import {ContentfulNoLocalesError} from './errors/ContentfulNoLocalesError'

export async function contentfulToDataset(
  data: ContentfulExport,
  opts: {
    intlMode: 'single' | 'multiple'
    weakRefs: boolean
    intlIdStructure: 'subpath' | 'delimiter'
    keepMarkdown: boolean
    locale: string | undefined
  },
): Promise<string> {
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
      importableEntries.add(
        contentfulEntryToSanityObject(entry, locale, data, {
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
