import {IntlIdStructure} from '@/constants'

type Options = {
  idStructure: IntlIdStructure,
  defaultLocale: string
  supportedLocales: string[]
}

type Fields = {
  __i18n_lang: string
  __i18n_refs?: {
    _key: string
    _type: 'reference'
    _ref: string
  }[]
  __i18n_base?: {
    _type: 'reference'
    _ref: string
  }
}

function buildI18nId(forId: string, locale: string, idStructure: IntlIdStructure) {
  return idStructure === IntlIdStructure.SUBPATH ?
    `i18n.${forId}.${locale}` :
    `${forId}__i18n_${locale}`
}

export function createIntlFields(
  forId: string,
  locale: string,
  options: Options,
): Fields {
  const result: Fields = {
    __i18n_lang: locale,
  }

  if (locale === options.defaultLocale) {
    result.__i18n_refs = options.supportedLocales
    .filter(lang => lang !== options.defaultLocale)
    .map(lang => ({
      _key: lang,
      _type: 'reference',
      _ref: buildI18nId(forId, lang, options.idStructure),
    }))
  }

  if (locale !== options.defaultLocale) {
    result.__i18n_base = {
      _type: 'reference',
      _ref: forId,
    }
  }

  return result
}
