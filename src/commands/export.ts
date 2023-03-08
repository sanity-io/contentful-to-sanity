import path from 'path'
import fs from 'fs-extra'
import compact from 'just-compact'
import contentfulExport, {ContentfulExport} from 'contentful-export'
import {parseManagementTokenFlag} from '@/helpers/flags/parseManagementTokenFlag'
import {parseSpaceFlag} from '@/helpers/flags/parseSpaceFlag'
import {CliUx, Command, Flags} from '@oclif/core'
import {
  ContentfulNoDefaultLocaleError,
  ContentfulNoLocalesError,
  ContentfulParamsMissingError,
} from '@/helpers/errors'
import {absolutify, contentfulEntryToSanityObject} from '@/utils'
import {SanityDocument} from '@sanity/client'
import {IntlIdStructure, IntlMode} from '@/constants'
import {parseOutputFlag} from '@/helpers/flags/parseOutputFlag'
import type {OptionFlag} from '@oclif/core/lib/interfaces'

const steps = {
  exporting: 'Exporting from contentful',
  createDataImport: 'Creating importable data package',
  importing: 'Importing into project',
}

export default class Export extends Command {
  static description = 'Create a Contentful export to import into Sanity'

  static flags = {
    space: Flags.string({
      char: 's',
      description: 'The Contentful space ID',
      exclusive: ['from-file'],
    }),
    environment: Flags.string({
      char: 'e',
      description: 'The Contentful environment',
      exclusive: ['from-file'],
    }),
    'from-file': Flags.string({
      char: 'f',
      description: 'The contentful file export to use',
      exclusive: ['space', 'environment'],
    }),
    project: Flags.string({char: 'p', description: 'The Sanity project ID'}),
    output: Flags.string({
      char: 'o',
      description: 'The output directory to output the ndjson to',
    }),
    'export-dir': Flags.string({
      description: 'The directory to save the Contentful export in.',
    }),
    'contentful-token': Flags.string({
      description: 'The Contentful management API token',
      env: 'CONTENTFUL_MANAGEMENT_TOKEN',
    }),
    'sanity-token': Flags.string({
      description: 'The Sanity token to use for interaction with the API',
      env: 'SANITY_TOKEN',
    }),
    'keep-markdown': Flags.boolean({
      description: 'Whether to keep markdown as-is or convert it to portable text',
      default: false,
    }),
    'weak-refs': Flags.boolean({
      description: 'Use weak refs instead of strong ones',
      default: false,
    }),
    intl: Flags.string({
      char: 'i',
      default: IntlMode.SINGLE,
      description:
        'Define the intl behavior. This is disabled by default and only one locale will be considered.',
      options: [IntlMode.SINGLE, IntlMode.MULTIPLE],
    }) as OptionFlag<IntlMode>,
    'intl-id-structure': Flags.string({
      default: IntlIdStructure.DELIMITER,
      description:
        'Defines the ID behavior for i18n. See @sanity/document-internationalization for more info',
      options: [IntlIdStructure.DELIMITER, IntlIdStructure.SUBPATH],
    }) as OptionFlag<IntlIdStructure>,
    locale: Flags.string({
      description: 'The locale to import. This should be used when using the intl single mode',
    }),
  }

  async run(): Promise<void> {
    const {flags} = await this.parse(Export)

    const space = await parseSpaceFlag(flags, {
      required: !flags['from-file'],
    })

    const contentfulToken = await parseManagementTokenFlag(flags, {
      required: !flags['from-file'],
    })

    const output = await parseOutputFlag(flags, {
      required: true,
      checkEmpty: false,
    })

    if (flags['export-dir']) {
      await fs.ensureDir(absolutify(flags['export-dir']))
    }

    let data: ContentfulExport | null = null
    if (flags['from-file']) {
      data = require(absolutify(flags['from-file']))
    } else {
      if (!space || !contentfulToken) {
        throw new ContentfulParamsMissingError(['space', 'contentfulToken'])
      }

      CliUx.ux.action.start(steps.exporting)
      data = await contentfulExport({
        exportDir: flags['export-dir'] ? absolutify(flags['export-dir']) : undefined,
        spaceId: space,
        managementToken: contentfulToken,
        environmentId: flags.environment,
        skipContentModel: false,
        skipEditorInterfaces: false,
        skipContent: false,
        skipWebhooks: true,
        skipRoles: true,
        downloadAssets: false,
        saveFile: Boolean(flags['export-dir']),
        maxAllowedLimit: 50,
      })
      CliUx.ux.action.stop(steps.exporting)
    }

    if (data?.entries?.length) {
      CliUx.ux.action.start(steps.createDataImport)
      const useMultiLocale = flags.intl === IntlMode.MULTIPLE
      const defaultLocale = (data.locales ?? []).find((locale) => Boolean(locale.default))
      const localesToImport = (
        useMultiLocale
          ? (data.locales ?? []).map(({code}) => code)
          : flags.locale
          ? [flags.locale]
          : compact([defaultLocale?.code])
      ).filter((code) => data?.locales?.some((locale) => locale.code === code))

      if (!defaultLocale) {
        throw new ContentfulNoDefaultLocaleError()
      }

      if (localesToImport.length === 0) {
        throw new ContentfulNoLocalesError()
      }

      if (data.entries) {
        const importableEntries: Set<SanityDocument> = new Set()
        for (const entry of data.entries) {
          for (const locale of localesToImport) {
            importableEntries.add(
              contentfulEntryToSanityObject(entry, locale, data, {
                useMultiLocale,
                idStructure: flags['intl-id-structure'],
                defaultLocale: defaultLocale.code,
                supportedLocales: localesToImport,
                keepMarkdown: flags['keep-markdown'],
                weakRefs: flags['weak-refs'],
              }),
            )
          }
        }

        await fs.writeFile(
          path.join(output, 'data.ndjson'),
          [...importableEntries].map((entry) => JSON.stringify(entry)).join('\n'),
        )
      }

      CliUx.ux.action.stop(steps.createDataImport)
    }

    CliUx.ux.done()
  }
}
