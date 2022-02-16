import fs from 'fs-extra'
import path from 'path'
import {SanityDocumentSchema, SanityObjectSchema} from '@/types'
import {stringify} from 'javascript-stringify'
import {IntlMode} from '@/constants'
import {ContentfulExport} from 'contentful-export'
import {ContentfulNoDefaultLocaleError} from '../errors'

type Flags = {
  intl?: IntlMode
  dir?: string
}

export async function writeSingleSanitySchema(
  schema: SanityDocumentSchema | SanityObjectSchema,
  data: ContentfulExport,
  flags: Flags = {},
): Promise<void> {
  const useMultiLocale = flags.intl === IntlMode.MULTIPLE
  const defaultLocale = data.locales?.find(locale => Boolean(locale.default))
  if (!defaultLocale) {
    throw new ContentfulNoDefaultLocaleError()
  }

  const schemasDir = path.join(flags.dir ?? process.cwd(), 'schemas')
  await fs.ensureDir(schemasDir)
  await fs.writeFile(
    path.join(schemasDir, `${schema.name}.js`),
    `export default ${stringify(schema, (value, space, next, key) => {
      if (key === 'validation') {
        if (Array.isArray(value) && value.length > 0) {
          return `Rule => Rule.cloneWithRules(${stringify(value)})`
        }

        return
      }

      if (key === 'initialValue') {
        if (useMultiLocale) {
          // @TODO
        } else {
          return next(value[defaultLocale.code], key)
        }
      }

      return next(value, key)
    }, 2)}`,
  )
}
