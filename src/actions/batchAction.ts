import type {BatchActionArgs} from '../parsers/batchActionArgs'
import {datasetAction} from './datasetAction'
import {exportAction} from './exportAction'
import {schemaAction} from './schemaAction'

export async function batchAction({
  datasetFile,
  environmentId,
  exportDir,
  exportFile,
  intl,
  intlIdStructure,
  keepMarkdown,
  optimizeSvgs,
  convertImages,
  locale,
  managementToken,
  accessToken,
  saveFile,
  schemaFile,
  spaceId,
  weakRefs,
}: BatchActionArgs) {
  await exportAction({
    environmentId,
    exportDir,
    exportFile,
    managementToken,
    accessToken,
    saveFile,
    spaceId,
  })

  await Promise.allSettled([
    schemaAction({
      exportDir,
      exportFile,
      intl,
      keepMarkdown,
      schemaFile,
    }),
    datasetAction({
      datasetFile,
      exportDir,
      exportFile,
      intl,
      intlIdStructure,
      keepMarkdown,
      optimizeSvgs,
      convertImages,
      locale,
      weakRefs,
    }),
  ])
}
