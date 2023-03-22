import {Command, Option} from 'commander'

import {version} from '../../package.json'
import {type BatchActionArgs, batchActionArgs} from '../parsers/batchActionArgs'
import {type DatasetActionArgs, datasetActionArgs} from '../parsers/datasetActionArgs'
import {type ExportActionArgs, exportActionArgs} from '../parsers/exportActionArgs'
import {type SchemaActionArgs, schemaActionArgs} from '../parsers/schemaActionArgs'
import {formatError} from '../utils'

export type {Command}

const outdirArgument = ['<outdir>', 'The directory to save the Contentful export in.'] as const
const exportFileOption = [
  '--export-file [name]',
  'The filename for the exported JSON document that holds your Contentful data.',
  'contentful.json',
] as const
const schemaFileOption = [
  '--schema-file [name]',
  'The filename for the generated Sanity Studio schema definitions file. Use `.js` file endings to strip TypeScript syntax.',
  'schema.ts',
] as const
const datasetFileOption = [
  '--dataset-file [name]',
  'The filename for the generated NDJSON document that can be used with the Sanity CLI `import` command',
  'dataset.ndjson',
] as const
const spaceIdOption = ['-s, --space-id <space-id>', 'The Contentful space ID'] as const
const environmentIdOption = [
  '-e, --environment-id [environment-id[',
  'Contentful environment',
  'master',
] as const
const managementTokenOption = [
  '-t, --management-token <management-token>',
  'Contentful Management API token',
] as const
const accessTokenOption = [
  '-a, --access-token <access-token>',
  'Contentful Content Delivery API access token',
] as const
const intlOption = new Option(
  '--intl [mode]',
  'Define the intl behavior. This is disabled by default and only one locale will be considered.',
)
  .default('single')
  .choices(['single', 'multiple'])
const weakRefsOption = ['--weak-refs', 'Use weak refs instead of strong ones', false] as const
const intlIdStructureOption = new Option(
  '--intl-id-structure [type]',
  'Defines the ID behavior for i18n. See @sanity/document-internationalization for more info',
)
  .default('delimiter')
  .choices(['subpath', 'delimiter'])
const markdownOption = [
  '--keep-markdown',
  'Whether to keep markdown as-is or convert it to portable text',
  false,
] as const
const localeOption = [
  '--locale [id]',
  'The locale to import. This should be used when using the intl single mode',
] as const

export type CommandActions = {
  batchAction: (args: BatchActionArgs) => Promise<void>
  exportAction: (args: ExportActionArgs) => Promise<void>
  schemaAction: (args: SchemaActionArgs) => Promise<void>
  datasetAction: (args: DatasetActionArgs) => Promise<void>
}

export interface ProgramOptions {
  actions?: Partial<CommandActions>
  exitOverride?: boolean
  suppressOutput?: boolean
}

const requiredAction = (name: string) => () => {
  throw new TypeError(`Missing required action: ${name}`)
}
const requiredActions = {
  batchAction: requiredAction('batchAction'),
  exportAction: requiredAction('schemaAction'),
  schemaAction: requiredAction('schemaAction'),
  datasetAction: requiredAction('datasetAction'),
}

// Inspired by https://github.com/shadowspawn/forest-arborist/blob/fca5ffcc5b300660ae9e1f6c4a8667d72feb0822/src/command.ts
export function makeProgram(opts: ProgramOptions = {}): Command {
  const program = new Command()
  const actions = {...requiredActions, ...opts.actions}

  // Configuration, for easy testing
  if (opts.exitOverride) {
    program.exitOverride()
  }
  if (opts.suppressOutput) {
    program.configureOutput({
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      writeOut: () => {},
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      writeErr: () => {},
    })
  }

  program.version(version).allowExcessArguments(false).allowUnknownOption(false)
  // .showHelpAfterError()

  program
    .command('export')
    .argument(...outdirArgument)
    .requiredOption(...spaceIdOption)
    .requiredOption(...managementTokenOption)
    .requiredOption(...accessTokenOption)
    .option(...environmentIdOption)
    .option(...exportFileOption)
    .action((exportDir, options) => {
      try {
        const args = exportActionArgs.parse({
          exportDir,
          ...options,
          saveFile: true,
        })
        return actions.exportAction(args)
      } catch (err) {
        throw formatError(err)
      }
    })

  program
    .command('schema')
    .argument(...outdirArgument)
    .option(...exportFileOption)
    .option(...schemaFileOption)
    .option(...markdownOption)
    .addOption(intlOption)
    .action((exportDir, options) => {
      try {
        const args = schemaActionArgs.parse({
          exportDir,
          ...options,
        })
        return actions.schemaAction(args)
      } catch (err) {
        throw formatError(err)
      }
    })

  program
    .command('dataset')
    .argument(...outdirArgument)
    .option(...exportFileOption)
    .option(...datasetFileOption)
    .option(...markdownOption)
    .addOption(intlOption)
    .option(...weakRefsOption)
    .addOption(intlIdStructureOption)
    .option(...localeOption)
    .action((exportDir, options) => {
      try {
        const args = datasetActionArgs.parse({
          exportDir,
          ...options,
        })
        return actions.datasetAction(args)
      } catch (err) {
        throw formatError(err)
      }
    })

  program
    .command('batch', {isDefault: true})
    .description('Runs the export, schema and dataset commands in sequence.')
    .argument(...outdirArgument)
    .requiredOption(...spaceIdOption)
    .requiredOption(...managementTokenOption)
    .requiredOption(...accessTokenOption)
    .option(...environmentIdOption)
    .option(...exportFileOption)
    .option(...schemaFileOption)
    .option(...datasetFileOption)
    .option(...markdownOption)
    .option(...weakRefsOption)
    .addOption(intlIdStructureOption)
    .option(...localeOption)
    .action((exportDir, options) => {
      try {
        const args = batchActionArgs.parse({
          exportDir,
          ...options,
          saveFile: true,
        })
        return actions.batchAction(args)
      } catch (err) {
        throw formatError(err)
      }
    })

  return program
}
