import {readFile, writeFile} from 'node:fs/promises'
import path from 'node:path'

import isAbsolutePath from '@stdlib/assert-is-absolute-path'
import invariant from 'tiny-invariant'

import {contentfulToDataset, localeDataFromExport} from '../helpers/contentfulToDataset'
import type {DatasetActionArgs} from '../parsers/datasetActionArgs'
import {convertUnsupportedImages} from '../processors/convertUnsupportedImages'
import {optimizeSVG} from '../processors/optimizeSVG'
import {ContentfulExport} from '../types'
import {absolutify} from '../utils/absolutify'
import {contentfulAssetUrlToContentType} from '../utils/contentfulAssetUrlToContentType'

export async function datasetAction({
  exportDir: _exportDir,
  exportFile,
  intl: intlMode,
  datasetFile,
  weakRefs,
  keepMarkdown,
  optimizeSvgs,
  convertImages,
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
  const publishedExportFilePath = path.join(
    exportDir,
    path.parse(exportFile).name + '.published.json',
  )
  const datasetFilePath = path.join(exportDir, datasetFile)
  invariant(
    isAbsolutePath(datasetFilePath),
    `datasetFilePath must be an absolute path: ${datasetFilePath}`,
  )

  const draftData = JSON.parse(await readFile(exportFilePath, 'utf8')) as ContentfulExport
  const publishedData: ContentfulExport = JSON.parse(
    await readFile(publishedExportFilePath, 'utf8'),
  )
  const convertedDataset = await contentfulToDataset(
    {
      drafts: draftData,
      published: publishedData,
    },
    {
      intlMode,
      weakRefs,
      intlIdStructure,
      keepMarkdown,
      locale,
    },
  )

  let dataset = convertedDataset

  if (optimizeSvgs) {
    dataset = await optimizeSVG(convertedDataset, exportDir)
  }

  if (convertImages) {
    const {defaultLocale} = localeDataFromExport(draftData, {
      intlMode,
      locale,
    })
    const contentTypeLookup = (url: string) => {
      if (draftData.assets) {
        contentfulAssetUrlToContentType(url, draftData.assets, defaultLocale.code)
      }
      // fall back to inferring from the url
      const ext = path.parse(url).ext
      // use ext without dot
      return ext ? `image/${ext.slice(1)}` : undefined
    }
    dataset = await convertUnsupportedImages(dataset, exportDir, contentTypeLookup)
  }

  await writeFile(datasetFilePath, dataset)
}
