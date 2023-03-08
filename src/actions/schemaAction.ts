import {readFile, writeFile} from 'node:fs/promises'
import path from 'node:path'

import isAbsolutePath from '@stdlib/assert-is-absolute-path'
import invariant from 'tiny-invariant'

import {contentfulToStudioSchema} from '../helpers/contentfulToStudioSchema'
import type {SchemaActionArgs} from '../parsers/schemaActionArgs'
import {ContentfulExport} from '../types'
import {absolutify} from '../utils/absolutify'

export async function schemaAction({
  exportDir: _exportDir,
  schemaFile,
  exportFile,
  intl: intlMode,
  keepMarkdown,
}: SchemaActionArgs) {
  const exportDir = absolutify(_exportDir)
  invariant(isAbsolutePath(exportDir), 'exportDir must be an absolute path')
  const exportFilePath = path.join(exportDir, exportFile)
  invariant(
    isAbsolutePath(exportFilePath),
    `exportFilePath must be an absolute path: ${exportFilePath}`,
  )
  const schemaFilePath = path.join(exportDir, schemaFile)
  invariant(
    isAbsolutePath(schemaFilePath),
    `schemaFilePath must be an absolute path: ${schemaFilePath}`,
  )
  const typescript = schemaFile.endsWith('.ts')

  const data: ContentfulExport = JSON.parse(await readFile(exportFilePath, 'utf8'))

  const schemaTypes = await contentfulToStudioSchema(data, {
    typescript,
    intlMode,
    keepMarkdown,
    filepath: schemaFilePath,
  })
  await writeFile(schemaFilePath, schemaTypes)
}
