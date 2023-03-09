import {describe, vi, afterEach, expect, test} from 'vitest'
import {makeProgram, type ProgramOptions, type Command, CommandActions} from './command'

const defaultActions = {
  defaultAction: vi.fn(),
  exportAction: vi.fn(),
  schemaAction: vi.fn(),
  datasetAction: vi.fn(),
} satisfies CommandActions
function fab(args: string[]): Command {
  return makeProgram({
    exitOverride: true,
    suppressOutput: true,
    actions: defaultActions,
  }).parse(args, {
    from: 'user',
  })
}
function fabAsync(args: string[]): Promise<Command> {
  return makeProgram({
    exitOverride: true,
    suppressOutput: true,
    actions: defaultActions,
  }).parseAsync(args, {
    from: 'user',
  })
}

describe('contentful-to-sanity [command] <outdir>', () => {
  afterEach(() => {
    for (const action of Object.values(defaultActions)) {
      action.mockClear()
    }
  })

  describe('export [options] <outdir>', () => {
    test('--help', () => {
      // expect(() => fab(['export', '--help'])).toThrowErrorMatchingInlineSnapshot('"(outputHelp)"')
      // try {
      //   fab(['export', '--help'])
      // } catch (err) {
      //   debugger
      //   console.error(err)
      // }
    })
    //
  })

  describe('schema [options] <outdir>', () => {
    //
  })

  describe('dataset [options] <outdir>', () => {
    //
  })

  //  default command (runs all subcommands in sequence)
  describe('[options] <outdir>', () => {
    //
  })

  // Ensure edge cases won't fail
  describe('edge cases', () => {
    test('--help', () => {
      const program = makeProgram({
        exitOverride: true,
        suppressOutput: true,
        actions: defaultActions,
      })
      expect(program.helpInformation(), 'default command').toMatchInlineSnapshot(`
        "Usage:  [options] [command] <outdir>

        Arguments:
          outdir                                     The output directory for the operation

        Options:
          -s, --space-id <space-id>                  The Contentful space ID
          -e, --environment-id [environment-id[      Contentful environment (default: \\"master\\")
          -t, --management-token <management-token>  Contentful Management API token
          --export-file [name]                        (default: \\"contentful.json\\")
          --schema-file [name]                        (default: \\"schema.js\\")
          --dataset-file [name]                       (default: \\"dataset.ndjson\\")
          -V, --version                              output the version number
          -h, --help                                 display help for command

        Commands:
          export [options] <outdir>
          schema [options] <outdir>
          dataset [options] <outdir>
        "
      `)
      expect.assertions(1 + program.commands.length)
      expect(program.commands[0].helpInformation(), program.commands[0].name())
        .toMatchInlineSnapshot(`
        "Usage:  export [options] <outdir>

        Arguments:
          outdir                                     The output directory for the operation

        Options:
          -s, --space-id <space-id>                  The Contentful space ID
          -e, --environment-id [environment-id[      Contentful environment (default: \\"master\\")
          -t, --management-token <management-token>  Contentful Management API token
          --export-file [name]                        (default: \\"contentful.json\\")
          -h, --help                                 display help for command
        "
      `)
      expect(program.commands[1].helpInformation(), program.commands[1].name())
        .toMatchInlineSnapshot(`
          "Usage:  schema [options] <outdir>

          Arguments:
            outdir                The output directory for the operation

          Options:
            --export-file [name]   (default: \\"contentful.json\\")
            --schema-file [name]   (default: \\"schema.js\\")
            -h, --help            display help for command
          "
        `)
      expect(program.commands[2].helpInformation(), program.commands[2].name())
        .toMatchInlineSnapshot(`
          "Usage:  dataset [options] <outdir>

          Arguments:
            outdir                The output directory for the operation

          Options:
            --export-file [name]   (default: \\"contentful.json\\")
            -h, --help            display help for command
          "
        `)
    })

    test('each action supports async handlers', async () => {
      expect.hasAssertions()
      const sequence: string[] = []
      defaultActions.defaultAction.mockImplementation(async () => {
        sequence.push('default:start')
        await new Promise((resolve) => setTimeout(resolve, 10))
        sequence.push('default:end')
      })
      defaultActions.exportAction.mockImplementation(async () => {
        sequence.push('export:start')
        await new Promise((resolve) => setTimeout(resolve, 10))
        sequence.push('export:end')
      })
      defaultActions.schemaAction.mockImplementation(async () => {
        sequence.push('schema:start')
        await new Promise((resolve) => setTimeout(resolve, 10))
        sequence.push('schema:end')
      })
      defaultActions.datasetAction.mockImplementation(async () => {
        sequence.push('dataset:start')
        await new Promise((resolve) => setTimeout(resolve, 10))
        sequence.push('dataset:end')
      })

      await fabAsync(['./export'])
      await fabAsync(['export', './export'])
      await fabAsync(['schema', './export'])
      await fabAsync(['dataset', './export'])
      expect(sequence, 'actions are awaited in order').toEqual([
        'default:start',
        'default:end',
        'export:start',
        'export:end',
        'schema:start',
        'schema:end',
        'dataset:start',
        'dataset:end',
      ])
    })
  })
})
