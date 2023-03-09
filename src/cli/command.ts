import {version} from '../../package.json'
import {Command} from 'commander'

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

// Inspired by https://github.com/shadowspawn/forest-arborist/blob/fca5ffcc5b300660ae9e1f6c4a8667d72feb0822/src/command.ts
export function makeProgram(options?: {exitOverride?: boolean; suppressOutput?: boolean}): Command {
  const program = new Command()

  // Configuration, for easy testing
  if (options?.exitOverride) {
    program.exitOverride()
  }
  if (options?.suppressOutput) {
    program.configureOutput({
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      writeOut: () => {},
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      writeErr: () => {},
    })
  }

  program
    .allowExcessArguments(false)
    .enablePositionalOptions()
    .configureHelp({sortSubcommands: true})
    .argument(...outdirArgument)
    .option(...spaceIdOption)
    .option(...environmentIdOption)
    .option(...managementTokenOption)
    .option(...exportFileOption)
    .option(...schemaFileOption)
    .option(...datasetFileOption)
    .version(version)
    .action(function (exportDir, options) {
      console.log('default command', {exportDir, options})
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
    })

  program
    .command('schema')
    .argument(...outdirArgument)
    .option(...exportFileOption)
    .option(...schemaFileOption)
    .action((exportDir, options) => {
      console.log('schema command', {exportDir, options})
    })

  program
    .command('dataset')
    .argument(...outdirArgument)
    .option(...exportFileOption)
    .action((exportDir, options) => {
      console.log('dataset command', {exportDir, options})
    })

  return program
}
