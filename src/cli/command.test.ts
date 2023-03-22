/* eslint-disable @typescript-eslint/no-empty-function */
import {afterEach, describe, expect, test, vi} from 'vitest'

import {type Command, CommandActions, makeProgram} from './command'

const defaultActions = {
  batchAction: vi.fn().mockImplementation(() => {}),
  exportAction: vi.fn().mockImplementation(() => {}),
  schemaAction: vi.fn().mockImplementation(() => {}),
  datasetAction: vi.fn().mockImplementation(() => {}),
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

const mockData = {
  outdir: './export',
  spaceId: ['--space-id', '123'] as const,
  mgmtToken: ['--management-token', 'abc'] as const,
  accessToken: ['--access-token', 'def'] as const,
}

describe('contentful-to-sanity [command] <outdir>', () => {
  afterEach(() => {
    for (const action of Object.values(defaultActions)) {
      action.mockClear()
    }
  })

  describe('export [options] <outdir>', () => {
    test('<outdir>', () => {
      expect(() =>
        fab(['export', ...mockData.spaceId, ...mockData.mgmtToken, ...mockData.accessToken]),
      ).toThrowErrorMatchingInlineSnapshot('"error: missing required argument \'outdir\'"')
      expect(defaultActions.exportAction).not.toHaveBeenCalled()

      fab([
        'export',
        ...mockData.spaceId,
        ...mockData.mgmtToken,
        ...mockData.accessToken,
        mockData.outdir,
      ])

      expect(defaultActions.exportAction).toHaveBeenCalled()
      expect(defaultActions.exportAction.mock.calls[0]).toMatchInlineSnapshot(`
        [
          {
            "accessToken": "def",
            "environmentId": "master",
            "exportDir": "./export",
            "exportFile": "contentful.json",
            "managementToken": "abc",
            "saveFile": true,
            "spaceId": "123",
          },
        ]
      `)
    })
    test('--space-id', () => {
      expect(() =>
        fab(['export', ...mockData.mgmtToken, ...mockData.accessToken, mockData.outdir]),
      ).toThrowErrorMatchingInlineSnapshot(
        '"error: required option \'-s, --space-id <space-id>\' not specified"',
      )
      expect(defaultActions.exportAction).not.toHaveBeenCalled()

      fab([
        'export',
        ...mockData.spaceId,
        ...mockData.mgmtToken,
        ...mockData.accessToken,
        mockData.outdir,
      ])
      expect(defaultActions.exportAction).toHaveBeenCalled()
      expect(defaultActions.exportAction.mock.calls[0]).toMatchInlineSnapshot(`
        [
          {
            "accessToken": "def",
            "environmentId": "master",
            "exportDir": "./export",
            "exportFile": "contentful.json",
            "managementToken": "abc",
            "saveFile": true,
            "spaceId": "123",
          },
        ]
      `)
    })
    test('--management-token', () => {
      expect(() =>
        fab(['export', ...mockData.spaceId, ...mockData.accessToken, mockData.outdir]),
      ).toThrowErrorMatchingInlineSnapshot(
        '"error: required option \'-t, --management-token <management-token>\' not specified"',
      )
      expect(defaultActions.exportAction).not.toHaveBeenCalled()

      fab([
        'export',
        ...mockData.spaceId,
        ...mockData.mgmtToken,
        ...mockData.accessToken,
        mockData.outdir,
      ])
      expect(defaultActions.exportAction).toHaveBeenCalled()
      expect(defaultActions.exportAction.mock.calls[0]).toMatchInlineSnapshot(`
        [
          {
            "accessToken": "def",
            "environmentId": "master",
            "exportDir": "./export",
            "exportFile": "contentful.json",
            "managementToken": "abc",
            "saveFile": true,
            "spaceId": "123",
          },
        ]
      `)
    })
  })

  describe('schema [options] <outdir>', () => {
    test('<outdir>', () => {
      expect(() => fab(['schema'])).toThrowErrorMatchingInlineSnapshot(
        '"error: missing required argument \'outdir\'"',
      )
      expect(defaultActions.schemaAction).not.toHaveBeenCalled()

      fab(['schema', mockData.outdir])

      expect(defaultActions.schemaAction).toHaveBeenCalled()
      expect(defaultActions.schemaAction.mock.calls[0]).toMatchInlineSnapshot(`
        [
          {
            "exportDir": "./export",
            "exportFile": "contentful.json",
            "intl": "single",
            "keepMarkdown": false,
            "schemaFile": "schema.ts",
          },
        ]
      `)
    })
  })

  describe('dataset [options] <outdir>', () => {
    test('<outdir>', () => {
      expect(() => fab(['dataset'])).toThrowErrorMatchingInlineSnapshot(
        '"error: missing required argument \'outdir\'"',
      )
      expect(defaultActions.datasetAction).not.toHaveBeenCalled()

      fab(['dataset', mockData.outdir])

      expect(defaultActions.datasetAction).toHaveBeenCalled()
      expect(defaultActions.datasetAction.mock.calls[0]).toMatchInlineSnapshot(`
        [
          {
            "datasetFile": "dataset.ndjson",
            "exportDir": "./export",
            "exportFile": "contentful.json",
            "intl": "single",
            "intlIdStructure": "delimiter",
            "keepMarkdown": false,
            "weakRefs": false,
          },
        ]
      `)
    })
  })

  describe('batch [options] <outdir>', () => {
    test('<outdir>', () => {
      expect(() =>
        fab(['batch', ...mockData.spaceId, ...mockData.mgmtToken, ...mockData.accessToken]),
      ).toThrowErrorMatchingInlineSnapshot('"error: missing required argument \'outdir\'"')
      expect(defaultActions.batchAction).not.toHaveBeenCalled()

      fab([
        'batch',
        ...mockData.spaceId,
        ...mockData.mgmtToken,
        ...mockData.accessToken,
        mockData.outdir,
      ])

      expect(defaultActions.batchAction).toHaveBeenCalled()
      expect(defaultActions.batchAction.mock.calls[0]).toMatchInlineSnapshot(`
        [
          {
            "accessToken": "def",
            "datasetFile": "dataset.ndjson",
            "environmentId": "master",
            "exportDir": "./export",
            "exportFile": "contentful.json",
            "intl": "single",
            "intlIdStructure": "delimiter",
            "keepMarkdown": false,
            "managementToken": "abc",
            "saveFile": true,
            "schemaFile": "schema.ts",
            "spaceId": "123",
            "weakRefs": false,
          },
        ]
      `)
    })
    test('--space-id', () => {
      expect(() =>
        fab(['batch', ...mockData.mgmtToken, ...mockData.accessToken, mockData.outdir]),
      ).toThrowErrorMatchingInlineSnapshot(
        '"error: required option \'-s, --space-id <space-id>\' not specified"',
      )
      expect(defaultActions.batchAction).not.toHaveBeenCalled()

      fab([
        'batch',
        ...mockData.spaceId,
        ...mockData.mgmtToken,
        ...mockData.accessToken,
        mockData.outdir,
      ])
      expect(defaultActions.batchAction).toHaveBeenCalled()
      expect(defaultActions.batchAction.mock.calls[0]).toMatchInlineSnapshot(`
        [
          {
            "accessToken": "def",
            "datasetFile": "dataset.ndjson",
            "environmentId": "master",
            "exportDir": "./export",
            "exportFile": "contentful.json",
            "intl": "single",
            "intlIdStructure": "delimiter",
            "keepMarkdown": false,
            "managementToken": "abc",
            "saveFile": true,
            "schemaFile": "schema.ts",
            "spaceId": "123",
            "weakRefs": false,
          },
        ]
      `)
    })
    test('--management-token', () => {
      expect(() =>
        fab(['batch', ...mockData.spaceId, ...mockData.accessToken, mockData.outdir]),
      ).toThrowErrorMatchingInlineSnapshot(
        '"error: required option \'-t, --management-token <management-token>\' not specified"',
      )
      expect(defaultActions.batchAction).not.toHaveBeenCalled()

      expect(() =>
        fab(['batch', ...mockData.spaceId, ...mockData.mgmtToken, mockData.outdir]),
      ).toThrowErrorMatchingInlineSnapshot(
        '"error: required option \'-a, --access-token <access-token>\' not specified"',
      )
      expect(defaultActions.batchAction).not.toHaveBeenCalled()

      fab([
        'batch',
        ...mockData.spaceId,
        ...mockData.mgmtToken,
        ...mockData.accessToken,
        mockData.outdir,
      ])
      expect(defaultActions.batchAction).toHaveBeenCalled()
      expect(defaultActions.batchAction.mock.calls[0]).toMatchInlineSnapshot(`
        [
          {
            "accessToken": "def",
            "datasetFile": "dataset.ndjson",
            "environmentId": "master",
            "exportDir": "./export",
            "exportFile": "contentful.json",
            "intl": "single",
            "intlIdStructure": "delimiter",
            "keepMarkdown": false,
            "managementToken": "abc",
            "saveFile": true,
            "schemaFile": "schema.ts",
            "spaceId": "123",
            "weakRefs": false,
          },
        ]
      `)
    })
    test('--access-token', () => {
      expect(() =>
        fab(['batch', ...mockData.spaceId, ...mockData.mgmtToken, mockData.outdir]),
      ).toThrowErrorMatchingInlineSnapshot(
        '"error: required option \'-a, --access-token <access-token>\' not specified"',
      )
      expect(defaultActions.batchAction).not.toHaveBeenCalled()

      fab([
        'batch',
        ...mockData.spaceId,
        ...mockData.mgmtToken,
        ...mockData.accessToken,
        mockData.outdir,
      ])
      expect(defaultActions.batchAction).toHaveBeenCalled()
      expect(defaultActions.batchAction.mock.calls[0]).toMatchInlineSnapshot(`
        [
          {
            "accessToken": "def",
            "datasetFile": "dataset.ndjson",
            "environmentId": "master",
            "exportDir": "./export",
            "exportFile": "contentful.json",
            "intl": "single",
            "intlIdStructure": "delimiter",
            "keepMarkdown": false,
            "managementToken": "abc",
            "saveFile": true,
            "schemaFile": "schema.ts",
            "spaceId": "123",
            "weakRefs": false,
          },
        ]
      `)
    })
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
        "Usage:  [options] [command]

        Options:
          -V, --version               output the version number
          -h, --help                  display help for command

        Commands:
          export [options] <outdir>
          schema [options] <outdir>
          dataset [options] <outdir>
          batch [options] <outdir>    Runs the export, schema and dataset commands in
                                      sequence.
          help [command]              display help for command
        "
      `)
      expect.assertions(1 + program.commands.length)
      expect(program.commands[0].helpInformation(), program.commands[0].name())
        .toMatchInlineSnapshot(`
          "Usage:  export [options] <outdir>

          Arguments:
            outdir                                     The directory to save the Contentful export in.

          Options:
            -s, --space-id <space-id>                  The Contentful space ID
            -t, --management-token <management-token>  Contentful Management API token
            -a, --access-token <access-token>          Contentful Content Delivery API access token
            -e, --environment-id [environment-id[      Contentful environment (default: \\"master\\")
            --export-file [name]                       The filename for the exported JSON document that holds your Contentful data. (default: \\"contentful.json\\")
            -h, --help                                 display help for command
          "
        `)
      expect(program.commands[1].helpInformation(), program.commands[1].name())
        .toMatchInlineSnapshot(`
          "Usage:  schema [options] <outdir>

          Arguments:
            outdir                The directory to save the Contentful export in.

          Options:
            --export-file [name]  The filename for the exported JSON document that holds
                                  your Contentful data. (default: \\"contentful.json\\")
            --schema-file [name]  The filename for the generated Sanity Studio schema
                                  definitions file. Use \`.js\` file endings to strip
                                  TypeScript syntax. (default: \\"schema.ts\\")
            --keep-markdown       Whether to keep markdown as-is or convert it to
                                  portable text (default: false)
            --intl [mode]         Define the intl behavior. This is disabled by default
                                  and only one locale will be considered. (choices:
                                  \\"single\\", \\"multiple\\", default: \\"single\\")
            -h, --help            display help for command
          "
        `)
      expect(program.commands[2].helpInformation(), program.commands[2].name())
        .toMatchInlineSnapshot(`
          "Usage:  dataset [options] <outdir>

          Arguments:
            outdir                      The directory to save the Contentful export in.

          Options:
            --export-file [name]        The filename for the exported JSON document that
                                        holds your Contentful data. (default:
                                        \\"contentful.json\\")
            --dataset-file [name]       The filename for the generated NDJSON document
                                        that can be used with the Sanity CLI \`import\`
                                        command (default: \\"dataset.ndjson\\")
            --keep-markdown             Whether to keep markdown as-is or convert it to
                                        portable text (default: false)
            --intl [mode]               Define the intl behavior. This is disabled by
                                        default and only one locale will be considered.
                                        (choices: \\"single\\", \\"multiple\\", default:
                                        \\"single\\")
            --weak-refs                 Use weak refs instead of strong ones (default:
                                        false)
            --intl-id-structure [type]  Defines the ID behavior for i18n. See
                                        @sanity/document-internationalization for more
                                        info (choices: \\"subpath\\", \\"delimiter\\", default:
                                        \\"delimiter\\")
            --locale [id]               The locale to import. This should be used when
                                        using the intl single mode
            -h, --help                  display help for command
          "
        `)
      expect(program.commands[3].helpInformation(), program.commands[3].name())
        .toMatchInlineSnapshot(`
          "Usage:  batch [options] <outdir>

          Runs the export, schema and dataset commands in sequence.

          Arguments:
            outdir                                     The directory to save the Contentful export in.

          Options:
            -s, --space-id <space-id>                  The Contentful space ID
            -t, --management-token <management-token>  Contentful Management API token
            -a, --access-token <access-token>          Contentful Content Delivery API access token
            -e, --environment-id [environment-id[      Contentful environment (default: \\"master\\")
            --export-file [name]                       The filename for the exported JSON document that holds your Contentful data. (default: \\"contentful.json\\")
            --schema-file [name]                       The filename for the generated Sanity Studio schema definitions file. Use \`.js\` file endings to strip TypeScript syntax. (default: \\"schema.ts\\")
            --dataset-file [name]                      The filename for the generated NDJSON document that can be used with the Sanity CLI \`import\` command (default: \\"dataset.ndjson\\")
            --keep-markdown                            Whether to keep markdown as-is or convert it to portable text (default: false)
            --weak-refs                                Use weak refs instead of strong ones (default: false)
            --intl-id-structure [type]                 Defines the ID behavior for i18n. See @sanity/document-internationalization for more info (choices: \\"subpath\\", \\"delimiter\\", default: \\"delimiter\\")
            --locale [id]                              The locale to import. This should be used when using the intl single mode
            -h, --help                                 display help for command
          "
        `)
    })

    test('each action supports async handlers', async () => {
      expect.hasAssertions()
      const sequence: string[] = []
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
      defaultActions.batchAction.mockImplementation(async () => {
        sequence.push('batch:start')
        await new Promise((resolve) => setTimeout(resolve, 10))
        sequence.push('batch:end')
      })

      await fabAsync([
        ...mockData.spaceId,
        ...mockData.mgmtToken,
        ...mockData.accessToken,
        './export',
      ])
      await fabAsync([
        'export',
        ...mockData.spaceId,
        ...mockData.mgmtToken,
        ...mockData.accessToken,
        './export',
      ])
      await fabAsync(['schema', './export'])
      await fabAsync(['dataset', './export'])
      await fabAsync([
        'batch',
        ...mockData.spaceId,
        ...mockData.mgmtToken,
        ...mockData.accessToken,
        './export',
      ])
      expect(sequence, 'actions are awaited in order').toEqual([
        'batch:start',
        'batch:end',
        'export:start',
        'export:end',
        'schema:start',
        'schema:end',
        'dataset:start',
        'dataset:end',
        'batch:start',
        'batch:end',
      ])
    })
  })
})
