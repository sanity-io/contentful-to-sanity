import fs from 'fs-extra'
import contentfulExport, {ContentfulExport} from 'contentful-export'
import {parseManagementTokenFlag} from '@/helpers/flags/parseManagementTokenFlag'
import {parseOutputFlag} from '@/helpers/flags/parseOutputFlag'
import {parseProjectFlag} from '@/helpers/flags/parseProjectFlag'
import {parseSanityTokenFlag} from '@/helpers/flags/parseSanityTokenFlag'
import {parseSpaceFlag} from '@/helpers/flags/parseSpaceFlag'
import {parseDatasetFlag} from '@/helpers/flags/parseDatasetFlag'
import {CliUx, Command, Flags} from '@oclif/core'
import {ContentfulParamsMissingError} from '@/helpers/errors'
import {absolutify, contentfulTypeToSanitySchema} from '@/utils'
import compact from 'just-compact'
import {bootstrapStudio, writeRootSanitySchema, writeSingleSanitySchema} from '@/helpers/sanity'
import {stringFieldSchemaFactory} from '@/helpers/sanity/fieldSchemaFactories'
import {IntlMode} from '@/constants'
import type {OptionFlag} from '@oclif/core/lib/interfaces'
import type {SanityDocumentSchema, SanityObjectSchema} from '@/types'

const steps = {
  exporting: 'Exporting from contentful',
  createSchema: 'Creating schema definitions',
  bootstrapStudio: 'Bootstrapping Sanity content studio',
}

export default class Bootstrap extends Command {
  static description = 'Migrate the structure of a Contentful space into a new or existing Sanity project'

  static flags = {
    space: Flags.string({char: 's', description: 'The Contentful space ID', exclusive: ['from-file']}),
    environment: Flags.string({char: 'e', description: 'The Contentful environment', exclusive: ['from-file']}),
    'from-file': Flags.string({char: 'f', description: 'The contentful file export to use', exclusive: ['space', 'environment']}),
    project: Flags.string({char: 'p', description: 'The Sanity project ID'}),
    dataset: Flags.string({char: 'd', description: 'The Sanity dataset'}),
    output: Flags.string({char: 'o', description: 'The output directory to output the Studio to'}),
    'export-dir': Flags.string({description: 'The directory to save the Contentful export in.'}),
    'contentful-token': Flags.string({description: 'The Contentful management API token', env: 'CONTENTFUL_MANAGEMENT_TOKEN'}),
    'sanity-token': Flags.string({description: 'The Sanity token to use for interaction with the API', env: 'SANITY_TOKEN'}),
    'keep-markdown': Flags.boolean({description: 'Whether to keep markdown as-is or convert it to portable text', default: false}),
    intl: Flags.string({
      char: 'i',
      default: IntlMode.SINGLE,
      description: 'Define the intl behavior. This is disabled by default and only one locale will be considered.',
      options: [IntlMode.SINGLE, IntlMode.MULTIPLE],
    }) as OptionFlag<IntlMode>,
  }

  async run(): Promise<void> {
    const {flags} = await this.parse(Bootstrap)

    const sanityToken = await parseSanityTokenFlag(flags, {
      required: true,
    })

    const project = await parseProjectFlag(flags, {
      required: true,
      sanityToken,
    })

    const dataset = await parseDatasetFlag(flags, {
      required: true,
      projectId: project.id,
      sanityToken,
    })

    const output = await parseOutputFlag(flags, {
      required: true,
    })

    const space = await parseSpaceFlag(flags, {
      required: !flags['from-file'],
    })

    const contentfulToken = await parseManagementTokenFlag(flags, {
      required: !flags['from-file'],
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
        skipContent: !flags['export-dir'],
        skipWebhooks: true,
        skipRoles: true,
        downloadAssets: false,
        saveFile: Boolean(flags['export-dir']),
        maxAllowedLimit: 50,
      })
      CliUx.ux.action.stop(steps.exporting)
    }

    if (data?.contentTypes) {
      CliUx.ux.action.start(steps.bootstrapStudio)
      /*
      await bootstrapStudio({
        project: project.id,
        dataset: dataset.name,
        output,
      })
      CliUx.ux.action.stop(steps.bootstrapStudio)
      */

      CliUx.ux.action.start(steps.createSchema)
      const schemas: (SanityDocumentSchema | SanityObjectSchema)[] = compact(data.contentTypes.map(type => (
        data && contentfulTypeToSanitySchema(type, data, flags)
      )))

      // add object break schema
      if (
        data.editorInterfaces?.some(editor => (
          editor.controls?.some(ctrl => ctrl.widgetId === 'richTextEditor')
        ))
      ) {
        const alreadyHasBreakSchema =  schemas.some(({name}) => name === 'break')
        if (alreadyHasBreakSchema) {
          console.warn('Found user-defined content model called "break". Be aware this could result in broken portable text')
        }

        if (!alreadyHasBreakSchema) {
          schemas.push({
            name: 'break',
            title: 'Break',
            type: 'object',
            fields: [
              stringFieldSchemaFactory('style').options({
                list: [
                  {title: 'Line break', value: 'lineBreak'},
                  {title: 'Read more', value: 'readMore'},
                ],
              }).build(),
            ],
          })
        }
      }

      // add tag schema
      if (data.tags?.length) {
        const alreadyHasTagSchema = schemas.some(({name}) => name === 'tag')
        if (alreadyHasTagSchema) {
          console.warn('Found user-defined content model called "tag". Please review manually as this could conflict with the tags data import from contentful')
        }

        if (!alreadyHasTagSchema) {
          schemas.push({
            name: 'tag',
            title: 'Tag',
            type: 'document',
            fields: [
              stringFieldSchemaFactory('name').title('Name')
              .validation([{flag: 'presence', constraint: 'required'}])
              .build(),
            ],
          })
        }
      }

      await Promise.all(schemas.map(schema => (
        data && writeSingleSanitySchema(schema, data, {
          ...flags,
          dir: output,
        })
      )))
      await writeRootSanitySchema(schemas, output)
      CliUx.ux.action.stop(steps.createSchema)

      CliUx.ux.done()
    }
  }
}
