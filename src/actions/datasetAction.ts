import {readFile, writeFile} from 'node:fs/promises'
import path from 'node:path'

import isAbsolutePath from '@stdlib/assert-is-absolute-path'
import invariant from 'tiny-invariant'

import {contentfulToDataset} from '../helpers/contentfulToDataset'
import type {DatasetActionArgs} from '../parsers/datasetActionArgs'
import {ContentfulExport} from '../types'
import {absolutify} from '../utils/absolutify'

export async function datasetAction({
  exportDir: _exportDir,
  exportFile,
  intl: intlMode,
  datasetFile,
  weakRefs,
  keepMarkdown,
  intlIdStructure,
  locale,
}: DatasetActionArgs) {
  const exportDir = absolutify(_exportDir)
  invariant(isAbsolutePath(exportDir), 'exportDir must be an absolute path')
  const exportFilePath = path.join(exportDir, exportFile)
  invariant(
    isAbsolutePath(exportFilePath),
    `exportFilePath must be an absolute path: ${exportFilePath}`,
  )
  const datasetFilePath = path.join(exportDir, datasetFile)
  invariant(
    isAbsolutePath(datasetFilePath),
    `datasetFilePath must be an absolute path: ${datasetFilePath}`,
  )

  const data: ContentfulExport = JSON.parse(await readFile(exportFilePath, 'utf8'))

  const convertedDataset = await contentfulToDataset(data, {
    intlMode,
    weakRefs,
    intlIdStructure,
    keepMarkdown,
    locale,
  })
  await writeFile(datasetFilePath, convertedDataset)
}
