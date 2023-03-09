import {Command} from 'commander'
// import {z} from 'zod'

import {version} from '../../package.json'

export type {Command}

const outdirArgument = ['<outdir>', 'The output directory for the operation'] as const
const exportFileOption = ['--export-file [name]', undefined, 'contentful.json'] as const
const schemaFileOption = ['--schema-file [name]', undefined, 'schema.js'] as const
const datasetFileOption = ['--dataset-file [name]', undefined, 'dataset.ndjson'] as const
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

export type CommandActions = {
  defaultAction: (exportDir: string, options: any) => void
  exportAction: (exportDir: string, options: any) => void
  schemaAction: (exportDir: string, options: any) => void
  datasetAction: (exportDir: string, options: any) => void
}

export interface ProgramOptions {
  actions?: CommandActions
  exitOverride?: boolean
  suppressOutput?: boolean
}

const requiredAction = (name: string) => () => {
  throw new TypeError(`Missing required action: ${name}`)
}
const requiredActions = {
  defaultAction: requiredAction('defaultAction'),
  exportAction: requiredAction('exportAction'),
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
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      // outputError: () => {},
    })
  }

  program
    .allowExcessArguments(false)
    .enablePositionalOptions()
    .argument(...outdirArgument)
    .option(...spaceIdOption)
    .option(...environmentIdOption)
    .option(...managementTokenOption)
    .option(...exportFileOption)
    .option(...schemaFileOption)
    .option(...datasetFileOption)
    .version(version)
    .action((exportDir, options) => {
      console.log('default command', {exportDir, options})
      // add zod step
      return actions.defaultAction(exportDir, options)
    })

  program
    .command('export')
    .argument(...outdirArgument)
    .option(...spaceIdOption)
    .option(...environmentIdOption)
    .option(...managementTokenOption)
    .option(...exportFileOption)
    .action((exportDir, options) => {
      console.log('export command', {exportDir, options})
      // add zod step
      return actions.exportAction(exportDir, options)
    })

  program
    .command('schema')
    .argument(...outdirArgument)
    .option(...exportFileOption)
    .option(...schemaFileOption)
    .action((exportDir, options) => {
      console.log('schema command', {exportDir, options})
      // add zod step
      return actions.schemaAction(exportDir, options)
    })

  program
    .command('dataset')
    .argument(...outdirArgument)
    .option(...exportFileOption)
    .action(async (exportDir, options) => {
      console.log('dataset command', {exportDir, options})
      // add zod step
      return actions.datasetAction(exportDir, options)
    })

  return program
}
